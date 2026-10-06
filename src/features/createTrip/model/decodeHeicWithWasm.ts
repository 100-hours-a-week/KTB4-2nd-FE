import type { HeicWasmRequest, HeicWasmResponse } from './heicWasmProtocol';
import { HeicPreviewResourceError } from './heicPreviewError';

type PendingDecode = {
  resolve: (response: HeicWasmResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const pending = new Map<number, PendingDecode>();
const DECODE_TIMEOUT_MS = 60_000;
let worker: Worker | null = null;
let nextRequestId = 0;
let preparation: Promise<void> | null = null;

function failWorker(current: Worker, error: Error) {
  if (worker !== current) return;
  worker = null;
  preparation = null;
  current.terminate();
  for (const request of pending.values()) {
    clearTimeout(request.timeout);
    request.reject(error);
  }
  pending.clear();
}

function loadWorker() {
  if (worker) return worker;
  const current = new Worker(new URL('./heicWasm.worker.ts', import.meta.url), {
    type: 'module',
    name: 'heic-preview-wasm',
  });
  worker = current;

  current.onmessage = ({ data }: MessageEvent<HeicWasmResponse>) => {
    if (worker !== current) return;
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    clearTimeout(request.timeout);
    if (data.error !== undefined) {
      request.reject(
        data.kind === 'module'
          ? new HeicPreviewResourceError('module', new Error(data.error))
          : new Error(data.error),
      );
    } else request.resolve(data);
  };
  current.onerror = (event) => {
    event.preventDefault();
    failWorker(current, new HeicPreviewResourceError('module', new Error(event.message)));
  };
  current.onmessageerror = () => {
    failWorker(current, new Error('Wasm Worker 결과를 읽을 수 없습니다.'));
  };
  return current;
}

function requestWorker(current: Worker, request: HeicWasmRequest): Promise<HeicWasmResponse> {
  return new Promise((resolve, reject) => {
    const { id } = request;
    const timeout = setTimeout(
      () => {
        failWorker(
          current,
          request.type === 'prepare'
            ? new HeicPreviewResourceError('module', new Error('Wasm 준비 시간이 초과되었습니다.'))
            : new Error('Wasm HEIC 디코딩 시간이 초과되었습니다.'),
        );
      },
      request.type === 'prepare' ? 15_000 : DECODE_TIMEOUT_MS,
    );
    pending.set(id, { resolve, reject, timeout });
    try {
      current.postMessage(request);
    } catch (error) {
      failWorker(current, error instanceof Error ? error : new Error('HEIC 전달에 실패했습니다.'));
    }
  });
}

export function prepareHeicWasmWorker(): Promise<void> {
  if (preparation) return preparation;
  const current = loadWorker();
  const attempt = requestWorker(current, { id: ++nextRequestId, type: 'prepare' }).then(
    (response) => {
      if (!('ready' in response)) throw new HeicPreviewResourceError('module');
    },
  );
  preparation = attempt;
  void attempt.catch(() => {
    if (preparation === attempt) preparation = null;
  });
  return attempt;
}

export async function decodeHeicWithWasm(file: Blob, signal: AbortSignal): Promise<ImageBitmap> {
  signal.throwIfAborted();
  const buffer = await file.arrayBuffer();
  signal.throwIfAborted();
  const response = await requestWorker(loadWorker(), { id: ++nextRequestId, buffer });
  if (!('imageData' in response) || !response.imageData) throw new Error('HEIC 결과가 없습니다.');

  // A running decode must settle before releasing a queue slot, even after removal.
  signal.throwIfAborted();
  const bitmap = await createImageBitmap(response.imageData);
  if (signal.aborted) {
    bitmap.close();
    signal.throwIfAborted();
  }
  return bitmap;
}
