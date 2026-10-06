import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const { importJs, importWasm, prepareWorker, decode, heicTo } = vi.hoisted(() => ({
  importJs: vi.fn(),
  importWasm: vi.fn(),
  prepareWorker: vi.fn(),
  decode: vi.fn(),
  heicTo: vi.fn(),
}));
vi.mock('heic-to', () => {
  importJs();
  return { heicTo };
});
vi.mock('./decodeHeicWithWasm', () => {
  importWasm();
  return { prepareHeicWasmWorker: prepareWorker, decodeHeicWithWasm: decode };
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_HEIC_PREVIEW_DECODER', 'js');
  importJs.mockReset();
  importWasm.mockReset();
  prepareWorker.mockReset().mockResolvedValue(undefined);
  heicTo.mockReset().mockResolvedValue({});
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
  expect(importJs).not.toHaveBeenCalled();
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
  expect(importJs).not.toHaveBeenCalled();
  finish({ ok: true, text: async () => 'heic-preview-online' } as Response);
  const [decoder, other] = await Promise.all([first, second]);
  expect(decoder).toBe(other);
  expect(importJs).toHaveBeenCalledOnce();
  expect(heicTo).not.toHaveBeenCalled();
  await prepareHeicPreviewDecoder();
  expect(fetch).toHaveBeenCalledOnce();
});

it('오프라인이면 연결 요청과 동적 import를 모두 건너뛴다', async () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'network' });
  expect(fetch).not.toHaveBeenCalled();
  expect(importJs).not.toHaveBeenCalled();
});

it('브라우저가 online이어도 실제 요청이 실패하면 import하지 않고 다음 시도에서 복구한다', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('연결 끊김'));
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'network' });
  expect(importJs).not.toHaveBeenCalled();
  const decoder = await prepareHeicPreviewDecoder();
  await decoder(new File(['heic'], 'photo.heic'), new AbortController().signal);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(heicTo).toHaveBeenCalledOnce();
});

it('연결 확인 파일 대신 오류 페이지가 반환되어도 모듈을 요청하지 않는다', async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    text: async () => '<html>offline</html>',
  } as Response);
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'network' });
  expect(importJs).not.toHaveBeenCalled();
});

it('이미 준비한 JS 디코더는 오프라인에서도 네트워크 없이 재사용한다', async () => {
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  const first = await prepareHeicPreviewDecoder();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const decoder = await prepareHeicPreviewDecoder();
  expect(decoder).toBe(first);
  const file = new File(['heic'], 'photo.heic');
  await decoder(file, new AbortController().signal);
  expect(heicTo).toHaveBeenCalledWith({ blob: file, type: 'bitmap' });
  expect(fetch).toHaveBeenCalledOnce();
});

it('Wasm은 Worker 초기화까지 준비하고 실패한 준비 Promise를 다음 시도에 재사용하지 않는다', async () => {
  vi.stubEnv('NEXT_PUBLIC_HEIC_PREVIEW_DECODER', 'wasm');
  prepareWorker.mockRejectedValueOnce(new Error('Worker 청크 실패'));
  const { prepareHeicPreviewDecoder } = await import('./heicPreviewDecoder');
  await expect(prepareHeicPreviewDecoder()).rejects.toMatchObject({ kind: 'module' });
  expect(await prepareHeicPreviewDecoder()).toBe(decode);
  expect(prepareWorker).toHaveBeenCalledTimes(2);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(importJs).not.toHaveBeenCalled();
});
