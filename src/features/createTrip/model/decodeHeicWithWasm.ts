import type { HeicWasmRequest, HeicWasmResponse } from './heicWasmProtocol';

type PendingDecode = {
  resolve: (imageData: ImageData) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const pending = new Map<number, PendingDecode>();
const DECODE_TIMEOUT_MS = 60_000;
let worker: Worker | null = null;
let nextRequestId = 0;

function failWorker(current: Worker, error: Error) {
  if (worker !== current) return;
  worker = null;
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
    if (data.error !== undefined) request.reject(new Error(data.error));
    else request.resolve(data.imageData);
  };
  current.onerror = (event) => {
    event.preventDefault();
    failWorker(current, new Error(event.message || 'Wasm Worker를 실행할 수 없습니다.'));
  };
  current.onmessageerror = () => {
    failWorker(current, new Error('Wasm Worker 결과를 읽을 수 없습니다.'));
  };
  return current;
}

export async function decodeHeicWithWasm(file: Blob, signal: AbortSignal): Promise<ImageBitmap> {
  signal.throwIfAborted();
  const buffer = await file.arrayBuffer();
  signal.throwIfAborted();
  const current = loadWorker();
  const id = ++nextRequestId;
  const imageData = await new Promise<ImageData>((resolve, reject) => {
    const timeout = setTimeout(() => {
      failWorker(current, new Error('Wasm HEIC 디코딩 시간이 초과되었습니다.'));
    }, DECODE_TIMEOUT_MS);
    pending.set(id, { resolve, reject, timeout });
    try {
      const request: HeicWasmRequest = { id, buffer };
      current.postMessage(request);
    } catch (error) {
      failWorker(current, error instanceof Error ? error : new Error('HEIC 전달에 실패했습니다.'));
    }
  });

  // A running decode must settle before releasing a queue slot, even after removal.
  signal.throwIfAborted();
  const bitmap = await createImageBitmap(imageData);
  if (signal.aborted) {
    bitmap.close();
    signal.throwIfAborted();
  }
  return bitmap;
}
