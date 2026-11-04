import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { importWasm, prepareWorker, decode } = vi.hoisted(() => ({
  importWasm: vi.fn(),
  prepareWorker: vi.fn(),
  decode: vi.fn(),
}));
vi.mock('./decodeHeicWithWasm', () => {
  importWasm();
  return { prepareHeicWasmWorker: prepareWorker, decodeHeicWithWasm: decode };
});

beforeEach(() => {
  vi.resetModules();
  importWasm.mockReset();
  prepareWorker.mockReset().mockResolvedValue(undefined);
  decode.mockReset().mockResolvedValue({});
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => 'heic-preview-online',
    })),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('로더를 import하는 것만으로는 큰 디코더나 연결 확인 요청을 시작하지 않는다', async () => {
  await import('./heicPreviewDecoder');
  expect(fetch).not.toHaveBeenCalled();
  expect(importWasm).not.toHaveBeenCalled();
});

it('연결 확인을 통과하기 전에는 디코더를 import하지 않고 준비 요청은 공유한다', async () => {
  let finish!: (value: Response) => void;
  vi.mocked(fetch).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  const first = prepareHeicPreviewDecoder();
  const second = prepareHeicPreviewDecoder();
  await Promise.resolve();
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/heic-preview-connectivity.txt?'), {
    cache: 'no-store',
    signal: expect.any(AbortSignal),
  });
  expect(importWasm).not.toHaveBeenCalled();
  finish({ ok: true, text: async () => 'heic-preview-online' } as Response);
  const [decoder, other] = await Promise.all([first, second]);
  expect(decoder).toBe(other);
  expect(importWasm).toHaveBeenCalledOnce();
  expect(prepareWorker).toHaveBeenCalledOnce();
  expect(decode).not.toHaveBeenCalled();
  await prepareHeicPreviewDecoder();
  expect(fetch).toHaveBeenCalledOnce();
});

it('오프라인이면 연결 요청과 동적 import를 모두 건너뛴다', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'network' });
  expect(fetch).not.toHaveBeenCalled();
  expect(importWasm).not.toHaveBeenCalled();
});

it('브라우저가 online이어도 실제 요청이 실패하면 import하지 않고 다음 시도에서 복구한다', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('연결 끊김'));
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'network' });
  expect(importWasm).not.toHaveBeenCalled();
  const decoder = await prepareHeicPreviewDecoder();
  await decoder(new File(['heic'], 'photo.heic'), new AbortController().signal);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(decode).toHaveBeenCalledOnce();
});

it('연결 확인 파일 대신 오류 페이지가 반환되어도 모듈을 요청하지 않는다', async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    text: async () => '<html>offline</html>',
  } as Response);
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'network' });
  expect(importWasm).not.toHaveBeenCalled();
});

it('이미 준비한 Wasm 디코더는 오프라인에서도 네트워크 없이 재사용한다', async () => {
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  const first = await prepareHeicPreviewDecoder();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const decoder = await prepareHeicPreviewDecoder();
  expect(decoder).toBe(first);
  const file = new File(['heic'], 'photo.heic');
  const signal = new AbortController().signal;
  await decoder(file, signal);
  expect(decode).toHaveBeenCalledWith(file, signal);
  expect(prepareWorker).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledOnce();
});

it('Wasm은 Worker 초기화까지 준비하고 실패한 준비 Promise를 다음 시도에 재사용하지 않는다', async () => {
  prepareWorker.mockRejectedValueOnce(new Error('Worker 청크 실패'));
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'module' });
  expect(await prepareHeicPreviewDecoder()).toBe(decode);
  expect(prepareWorker).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('운영 환경에서 별도 디코더 설정 없이 Wasm을 준비한다', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  expect(await prepareHeicPreviewDecoder()).toBe(decode);
  expect(prepareWorker).toHaveBeenCalledOnce();
});

it('명시적으로 초기화하면 연결을 다시 확인하고 디코더를 준비한다', async () => {
  const { prepareHeicPreviewDecoder, resetHeicPreviewDecoder } =
    await import('./heicPreviewDecoder');
  await prepareHeicPreviewDecoder();
  resetHeicPreviewDecoder();
  await prepareHeicPreviewDecoder();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(prepareWorker).toHaveBeenCalledTimes(2);
});
