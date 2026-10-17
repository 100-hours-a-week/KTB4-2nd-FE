import type { HeicWasmRequest, HeicWasmResponse } from './heicWasmProtocol';
import { HeicPreviewResourceError } from './heicPreviewError';
import { getHeicWorkerCount } from './heicWorkerCount';

type PendingDecode = {
  resolve: (response: HeicWasmResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type WorkerEntry = {
  worker: Worker;
  pending: Map<number, PendingDecode>;
  preparation: Promise<void> | null;
};

const DECODE_TIMEOUT_MS = 60_000;
// 기기별 Worker 수는 처음 사용할 때 정합니다. 변환 큐도 같은 값을 써서 Worker마다 한 장씩 맡깁니다.
let workers: (WorkerEntry | null)[] | null = null;
let nextRequestId = 0;
let preparation: Promise<void> | null = null;

function getWorkerSlots() {
  workers ??= Array.from({ length: getHeicWorkerCount() }, () => null);
  return workers;
}

function failWorker(entry: WorkerEntry, error: Error) {
  const slots = getWorkerSlots();
  const index = slots.indexOf(entry);
  if (index === -1) return;
  slots[index] = null;
  preparation = null;
  entry.worker.terminate();
  for (const request of entry.pending.values()) {
    clearTimeout(request.timeout);
    request.reject(error);
  }
  entry.pending.clear();
}

function loadWorker(index: number): WorkerEntry {
  const slots = getWorkerSlots();
  const existing = slots[index];
  if (existing) return existing;
  const current = new Worker(new URL('./heicWasm.worker.ts', import.meta.url), {
    type: 'module',
    name: `heic-preview-wasm-${index + 1}`,
  });
  const entry: WorkerEntry = { worker: current, pending: new Map(), preparation: null };
  slots[index] = entry;

  current.onmessage = ({ data }: MessageEvent<HeicWasmResponse>) => {
    if (slots[index] !== entry) return;
    const request = entry.pending.get(data.id);
    if (!request) return;
    entry.pending.delete(data.id);
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
    failWorker(entry, new HeicPreviewResourceError('module', new Error(event.message)));
  };
  current.onmessageerror = () => {
    failWorker(entry, new Error('Wasm Worker 결과를 읽을 수 없습니다.'));
  };
  return entry;
}

function loadWorkers(): WorkerEntry[] {
  return getWorkerSlots().map((_, index) => loadWorker(index));
}

function requestWorker(entry: WorkerEntry, request: HeicWasmRequest): Promise<HeicWasmResponse> {
  return new Promise((resolve, reject) => {
    const { id } = request;
    const timeout = setTimeout(
      () => {
        failWorker(
          entry,
          request.type === 'prepare'
            ? new HeicPreviewResourceError('module', new Error('Wasm 준비 시간이 초과되었습니다.'))
            : new Error('Wasm HEIC 디코딩 시간이 초과되었습니다.'),
        );
      },
      request.type === 'prepare' ? 15_000 : DECODE_TIMEOUT_MS,
    );
    entry.pending.set(id, { resolve, reject, timeout });
    try {
      entry.worker.postMessage(request);
    } catch (error) {
      failWorker(entry, error instanceof Error ? error : new Error('HEIC 전달에 실패했습니다.'));
    }
  });
}

function prepareWorker(entry: WorkerEntry): Promise<void> {
  if (entry.preparation) return entry.preparation;
  const attempt = requestWorker(entry, { id: ++nextRequestId, type: 'prepare' }).then(
    (response) => {
      if (!('ready' in response)) throw new HeicPreviewResourceError('module');
    },
  );
  entry.preparation = attempt;
  void attempt.catch(() => {
    if (entry.preparation === attempt) entry.preparation = null;
  });
  return attempt;
}

export function prepareHeicWasmWorker(): Promise<void> {
  if (preparation) return preparation;
  const attempt = Promise.all(loadWorkers().map(prepareWorker)).then(() => undefined);
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
  const entry = loadWorkers().reduce((leastBusy, current) =>
    current.pending.size < leastBusy.pending.size ? current : leastBusy,
  );
  const response = await requestWorker(entry, { id: ++nextRequestId, buffer });
  if (!('imageData' in response) || !response.imageData) throw new Error('HEIC 결과가 없습니다.');
  signal.throwIfAborted();
  const bitmap = await createImageBitmap(response.imageData);
  if (signal.aborted) {
    bitmap.close();
    signal.throwIfAborted();
  }
  return bitmap;
}
