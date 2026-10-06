import type { LibheifModule } from 'libheif-js/libheif-wasm/libheif-bundle.mjs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { HeicWasmRequest, HeicWasmResponse } from './heicWasmProtocol';

const { factory, decode } = vi.hoisted(() => ({ factory: vi.fn(), decode: vi.fn() }));
vi.mock('libheif-js/libheif-wasm/libheif-bundle.mjs', () => ({ default: factory }));
vi.mock('./decodeHeicPixels', () => ({ decodeHeicPixels: decode }));

let scope: {
  onmessage: (event: { data: HeicWasmRequest }) => Promise<void>;
  postMessage: ReturnType<typeof vi.fn<(response: HeicWasmResponse) => void>>;
};
const libheif = {} as LibheifModule;
const pixels = {} as ImageData;
const request = (id: number) => ({ data: { id, buffer: new ArrayBuffer(4) } });

beforeEach(() => {
  vi.resetModules();
  factory.mockReset().mockReturnValue(libheif);
  decode.mockReset().mockResolvedValue(pixels);
  scope = { onmessage: async () => undefined, postMessage: vi.fn() };
  vi.stubGlobal('self', scope);
});
afterEach(() => vi.unstubAllGlobals());

it('브라우저에서 동기 반환하는 Wasm 모듈도 사용하고 초기화는 재사용한다', async () => {
  await import('./heicWasm.worker');
  await Promise.all([scope.onmessage(request(1)), scope.onmessage(request(2))]);
  expect(factory).toHaveBeenCalledOnce();
  expect(decode).toHaveBeenCalledTimes(2);
  expect(scope.postMessage).toHaveBeenCalledWith({ id: 1, imageData: pixels });
  expect(scope.postMessage).toHaveBeenCalledWith({ id: 2, imageData: pixels });
});

it('비동기 초기화가 끝난 뒤 디코딩한다', async () => {
  let finish!: (module: LibheifModule) => void;
  factory.mockReturnValue(
    new Promise<LibheifModule>((resolve) => {
      finish = resolve;
    }),
  );
  await import('./heicWasm.worker');
  const response = scope.onmessage(request(1));
  await Promise.resolve();
  expect(decode).not.toHaveBeenCalled();
  finish(libheif);
  await response;
  expect(scope.postMessage).toHaveBeenCalledWith({ id: 1, imageData: pixels });
});

it('초기화 실패를 전달하고 다음 요청에서 다시 초기화한다', async () => {
  factory.mockRejectedValueOnce(new Error('Wasm 초기화 실패'));
  await import('./heicWasm.worker');
  await scope.onmessage(request(1));
  expect(scope.postMessage).toHaveBeenCalledWith({
    id: 1,
    error: 'Wasm 초기화 실패',
    kind: 'module',
  });
  await scope.onmessage(request(2));
  expect(factory).toHaveBeenCalledTimes(2);
  expect(scope.postMessage).toHaveBeenCalledWith({ id: 2, imageData: pixels });
});

it('사진 없이 Wasm을 미리 준비하고 실제 디코딩에서 초기화 결과를 재사용한다', async () => {
  await import('./heicWasm.worker');
  await scope.onmessage({ data: { id: 1, type: 'prepare' } });
  expect(factory).toHaveBeenCalledOnce();
  expect(decode).not.toHaveBeenCalled();
  expect(scope.postMessage).toHaveBeenCalledWith({ id: 1, ready: true });
  await scope.onmessage(request(2));
  expect(factory).toHaveBeenCalledOnce();
  expect(decode).toHaveBeenCalledOnce();
});
