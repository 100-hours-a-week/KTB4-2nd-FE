import { getHeicPreviewDecoderMode, type HeicPreviewDecoderMode } from './heicPreviewDecoderMode';
import { HeicPreviewResourceError } from './heicPreviewError';

type Decoder = (file: File, signal: AbortSignal) => Promise<ImageBitmap>;
const decoders = new Map<HeicPreviewDecoderMode, Promise<Decoder>>();

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
  decoders.delete(getHeicPreviewDecoderMode());
}

export function prepareHeicPreviewDecoder(): Promise<Decoder> {
  const mode = getHeicPreviewDecoderMode();
  const existing = decoders.get(mode);
  if (existing) return existing;

  const preparation = Promise.resolve().then(async () => {
    await checkConnection();
    try {
      if (mode === 'wasm') {
        const { prepareHeicWasmWorker, decodeHeicWithWasm } = await import('./decodeHeicWithWasm');
        await prepareHeicWasmWorker();
        return decodeHeicWithWasm;
      }
      const { heicTo } = await import('heic-to');
      return async (file: File, signal: AbortSignal) => {
        signal.throwIfAborted();
        return heicTo({ blob: file, type: 'bitmap' });
      };
    } catch (cause) {
      if (cause instanceof HeicPreviewResourceError) throw cause;
      throw new HeicPreviewResourceError(navigator.onLine ? 'module' : 'network', cause);
    }
  });
  decoders.set(mode, preparation);
  void preparation.catch(() => {
    if (decoders.get(mode) === preparation) decoders.delete(mode);
  });
  return preparation;
}
