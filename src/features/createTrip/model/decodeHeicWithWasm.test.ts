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

it('하나의 Worker를 재사용하고 순서가 다른 응답을 해당 요청에 전달한다', async () => {
  const { decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
  const signal = new AbortController().signal;
  const first = decodeHeicWithWasm(file(), signal);
  const second = decodeHeicWithWasm(file(), signal);
  await Promise.resolve();
  expect(instances).toHaveLength(1);
  const current = instances[0];
  expect(current.options).toMatchObject({ type: 'module' });
  expect(current.postMessage).toHaveBeenCalledTimes(2);
  current.reply(2);
  await second;
  expect(createImageBitmap).toHaveBeenCalledOnce();
  current.reply(1);
  await first;
  expect(createImageBitmap).toHaveBeenCalledTimes(2);
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
  instances[0].reply(2);
  await second;
  expect(instances[0].terminate).not.toHaveBeenCalled();
});

it('응답이 없으면 Worker와 모든 대기를 정리하고 다음 요청에서 다시 생성한다', async () => {
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
  const next = decodeHeicWithWasm(file(), signal);
  await Promise.resolve();
  expect(instances).toHaveLength(2);
  instances[1].reply(3);
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

it('준비 요청은 공유하고 준비 완료 후에는 새 요청을 보내지 않는다', async () => {
  const { prepareHeicWasmWorker } = await import('./decodeHeicWithWasm');
  const first = prepareHeicWasmWorker();
  const second = prepareHeicWasmWorker();
  expect(instances).toHaveLength(1);
  expect(instances[0].postMessage).toHaveBeenCalledOnce();
  instances[0].onmessage?.({ data: { id: 1, ready: true } });
  await Promise.all([first, second]);
  await prepareHeicWasmWorker();
  expect(instances[0].postMessage).toHaveBeenCalledOnce();
  expect(createImageBitmap).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('준비 시간 초과는 모듈 실패로 전달하고 새 Worker에서 재시도한다', async () => {
  const { prepareHeicWasmWorker } = await import('./decodeHeicWithWasm');
  const first = prepareHeicWasmWorker();
  const assertion = expect(first).rejects.toMatchObject({ kind: 'module' });
  await vi.advanceTimersByTimeAsync(15_000);
  await assertion;
  const second = prepareHeicWasmWorker();
  expect(instances).toHaveLength(2);
  instances[1].onmessage?.({ data: { id: 2, ready: true } });
  await second;
});
