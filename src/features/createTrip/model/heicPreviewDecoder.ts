import { HeicPreviewResourceError } from './heicPreviewError';

type Decoder = (file: File, signal: AbortSignal) => Promise<ImageBitmap>;
let decoder: Promise<Decoder> | undefined;

async function checkConnection() {
  if (!navigator.onLine) throw new HeicPreviewResourceError('network');
  try {
    const response = await fetch(`/heic-preview-connectivity.txt?check=${Date.now()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok || (await response.text()).trim() !== 'heic-preview-online') {
      throw new Error('연결 확인 응답이 유효하지 않습니다.');
    }
  } catch (cause) {
    throw new HeicPreviewResourceError('network', cause);
  }
}

export function resetHeicPreviewDecoder() {
  decoder = undefined;
}

export function prepareHeicPreviewDecoder(): Promise<Decoder> {
  if (decoder) return decoder;

  const preparation = Promise.resolve().then(async () => {
    await checkConnection();
    try {
      const { prepareHeicWasmWorker, decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
      await prepareHeicWasmWorker();
      return decodeHeicWithWasm;
    } catch (cause) {
      if (cause instanceof HeicPreviewResourceError) throw cause;
      throw new HeicPreviewResourceError(navigator.onLine ? 'module' : 'network', cause);
    }
  });
  decoder = preparation;
  void preparation.catch(() => {
    if (decoder === preparation) decoder = undefined;
  });
  return preparation;
}
