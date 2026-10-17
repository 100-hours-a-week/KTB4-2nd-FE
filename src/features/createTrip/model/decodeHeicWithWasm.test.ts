import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { HeicWasmRequest, HeicWasmResponse } from './heicWasmProtocol';

let instances: MockWorker[];
class MockWorker {
  onmessage?: (event: { data: HeicWasmResponse }) => void;
  onerror?: (event: { message: string; preventDefault: () => void }) => void;
  onmessageerror?: () => void;
  postMessage = vi.fn<(request: HeicWasmRequest) => void>();
  terminate = vi.fn();
  constructor(
    public url: URL,
    public options: WorkerOptions,
  ) {
    instances.push(this);
  }
  reply(id: number) {
    this.onmessage?.({ data: { id, imageData: {} as ImageData } });
  }
}
const file = () => ({ arrayBuffer: async () => new ArrayBuffer(4) }) as Blob;
const WORKER_COUNT = 6;
vi.mock('./heicWorkerCount', () => ({ getHeicWorkerCount: () => WORKER_COUNT }));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  instances = [];
  vi.stubGlobal('Worker', MockWorker);
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => ({ close: vi.fn() })),
  );
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('여섯 사진을 서로 다른 Worker로 보내고 먼저 끝난 Worker를 재사용한다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const signal = new AbortController().signal;
  const results = Array.from({ length: WORKER_COUNT }, () => decodeHeicWithWasm(file(), signal));
  await Promise.resolve();
  expect(instances).toHaveLength(WORKER_COUNT);
  instances.forEach((instance, index) => {
    expect(instance.options).toMatchObject({
      type: 'module',
      name: `heic-preview-wasm-${index + 1}`,
    });
    expect(instance.postMessage).toHaveBeenCalledExactlyOnceWith({
      id: index + 1,
      buffer: expect.any(ArrayBuffer),
    });
  });
  instances[1].reply(2);
  await results[1];
  expect(createImageBitmap).toHaveBeenCalledOnce();
  const next = decodeHeicWithWasm(file(), signal);
  await Promise.resolve();
  expect(instances).toHaveLength(WORKER_COUNT);
  expect(instances[1].postMessage).toHaveBeenCalledTimes(2);
  instances[1].reply(WORKER_COUNT + 1);
  await next;
  instances.forEach((instance, index) => {
    if (index !== 1) instance.reply(index + 1);
  });
  await Promise.all(results);
  expect(createImageBitmap).toHaveBeenCalledTimes(WORKER_COUNT + 1);
  expect(vi.getTimerCount()).toBe(0);
});

it('사진 삭제 후에도 실행 중인 디코딩이 끝날 때까지 기다리고 Bitmap은 만들지 않는다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const controller = new AbortController();
  const result = decodeHeicWithWasm(file(), controller.signal);
  const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await Promise.resolve();
  controller.abort();
  expect(instances[0].terminate).not.toHaveBeenCalled();
  instances[0].reply(1);
  await assertion;
  expect(createImageBitmap).not.toHaveBeenCalled();
});

it('Bitmap 생성 중 취소되면 완성된 Bitmap도 해제한다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const controller = new AbortController();
  const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
  let finish!: (value: ImageBitmap) => void;
  vi.mocked(createImageBitmap).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const result = decodeHeicWithWasm(file(), controller.signal);
  const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await Promise.resolve();
  instances[0].reply(1);
  await Promise.resolve();
  controller.abort();
  finish(bitmap);
  await assertion;
  expect(bitmap.close).toHaveBeenCalledOnce();
});

it('사진 하나의 디코딩 오류는 다른 요청을 중단시키지 않는다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const signal = new AbortController().signal;
  const first = decodeHeicWithWasm(file(), signal);
  const assertion = expect(first).rejects.toThrow('잘못된 사진');
  const second = decodeHeicWithWasm(file(), signal);
  await Promise.resolve();
  instances[0].onmessage?.({ data: { id: 1, error: '잘못된 사진' } });
  await assertion;
  instances[1].reply(2);
  await second;
  expect(instances[0].terminate).not.toHaveBeenCalled();
});

it('응답이 없으면 해당 Worker의 대기를 정리하고 다음 요청에서 다시 생성한다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const signal = new AbortController().signal;
  const first = decodeHeicWithWasm(file(), signal);
  const second = decodeHeicWithWasm(file(), signal);
  const assertions = [
    expect(first).rejects.toThrow('초과'),
    expect(second).rejects.toThrow('초과'),
  ];
  await vi.advanceTimersByTimeAsync(60_000);
  await Promise.all(assertions);
  expect(instances[0].terminate).toHaveBeenCalledOnce();
  expect(instances[1].terminate).toHaveBeenCalledOnce();
  const next = decodeHeicWithWasm(file(), signal);
  await Promise.resolve();
  expect(instances).toHaveLength(WORKER_COUNT + 2);
  for (const instance of instances.slice(2, WORKER_COUNT)) {
    expect(instance.terminate).not.toHaveBeenCalled();
  }
  instances[WORKER_COUNT].reply(3);
  await next;
});

it('Worker 실행 오류를 호출자에게 전달하고 대기를 정리한다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const result = decodeHeicWithWasm(file(), new AbortController().signal);
  const assertion = expect(result).rejects.toMatchObject({ kind: 'module' });
  await Promise.resolve();
  instances[0].onerror?.({ message: '실행 실패', preventDefault: vi.fn() });
  await assertion;
  expect(instances[0].terminate).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});

it('여섯 Worker의 준비 요청을 공유하고 모두 준비된 후에는 새 요청을 보내지 않는다', async () => {
  const { prepareHeicWasmWorker } = await import('./decodeHeicWithWasm');
  const first = prepareHeicWasmWorker();
  const second = prepareHeicWasmWorker();
  expect(instances).toHaveLength(WORKER_COUNT);
  instances.forEach((instance) => expect(instance.postMessage).toHaveBeenCalledOnce());
  let ready = false;
  void first.then(() => {
    ready = true;
  });
  for (let index = 0; index < WORKER_COUNT - 1; index += 1) {
    instances[index].onmessage?.({ data: { id: index + 1, ready: true } });
    await Promise.resolve();
    expect(ready).toBe(false);
  }
  instances[WORKER_COUNT - 1].onmessage?.({ data: { id: WORKER_COUNT, ready: true } });
  await Promise.all([first, second]);
  await prepareHeicWasmWorker();
  instances.forEach((instance) => expect(instance.postMessage).toHaveBeenCalledOnce());
  expect(createImageBitmap).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('준비 시간 초과는 모듈 실패로 전달하고 준비된 Worker는 유지한 채 재시도한다', async () => {
  const { prepareHeicWasmWorker } = await import('./decodeHeicWithWasm');
  const first = prepareHeicWasmWorker();
  const assertion = expect(first).rejects.toMatchObject({ kind: 'module' });
  instances.slice(1).forEach((instance, index) => {
    instance.onmessage?.({ data: { id: index + 2, ready: true } });
  });
  await vi.advanceTimersByTimeAsync(15_000);
  await assertion;
  const second = prepareHeicWasmWorker();
  expect(instances).toHaveLength(WORKER_COUNT + 1);
  instances.slice(1, WORKER_COUNT).forEach((instance) => {
    expect(instance.terminate).not.toHaveBeenCalled();
    expect(instance.postMessage).toHaveBeenCalledOnce();
  });
  instances[WORKER_COUNT].onmessage?.({ data: { id: WORKER_COUNT + 1, ready: true } });
  await second;
});

it('한 Worker의 실행 오류가 다른 Worker의 디코딩을 중단시키지 않는다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const signal = new AbortController().signal;
  const first = decodeHeicWithWasm(file(), signal);
  const assertion = expect(first).rejects.toMatchObject({ kind: 'module' });
  const second = decodeHeicWithWasm(file(), signal);
  await Promise.resolve();
  instances[0].onerror?.({ message: '실행 실패', preventDefault: vi.fn() });
  await assertion;
  expect(instances[1].terminate).not.toHaveBeenCalled();
  instances[1].reply(2);
  await second;
  const next = decodeHeicWithWasm(file(), signal);
  await Promise.resolve();
  expect(instances).toHaveLength(WORKER_COUNT + 1);
  // 종료된 Worker의 늦은 응답은 무시한다.
  instances[0].reply(3);
  expect(createImageBitmap).toHaveBeenCalledOnce();
  instances[WORKER_COUNT].reply(3);
  await next;
  expect(vi.getTimerCount()).toBe(0);
});

it('다른 Worker가 아직 처리 중이어도 완료된 Worker에는 타임아웃이 남지 않는다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const signal = new AbortController().signal;
  const first = decodeHeicWithWasm(file(), signal);
  const second = decodeHeicWithWasm(file(), signal);
  const assertion = expect(first).rejects.toThrow('초과');
  await Promise.resolve();
  instances[1].reply(2);
  await second;
  await vi.advanceTimersByTimeAsync(60_000);
  await assertion;
  expect(instances[0].terminate).toHaveBeenCalledOnce();
  expect(instances[1].terminate).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
