import { createPreviewConversionQueue } from './previewConversionQueue';
import { createThumbnailBlob } from './createThumbnailBlob';
import { getHeicPreviewDecoderMode } from './heicPreviewDecoderMode';

export const HEIC_PREVIEW_CONCURRENCY = 2;

const heicPreviewQueue = createPreviewConversionQueue(HEIC_PREVIEW_CONCURRENCY);
let heicModulePromise: Promise<typeof import('heic-to')> | null = null;
let wasmModulePromise: Promise<typeof import('./decodeHeicWithWasm')> | null = null;

function loadWasmModule() {
  if (!wasmModulePromise) {
    wasmModulePromise = import('./decodeHeicWithWasm').catch((error: unknown) => {
      wasmModulePromise = null;
      throw error;
    });
  }
  return wasmModulePromise;
}

function loadHeicModule() {
  if (!heicModulePromise) {
    heicModulePromise = import('heic-to').catch((error: unknown) => {
      heicModulePromise = null;
      throw error;
    });
  }

  return heicModulePromise;
}

function isHeicFile(file: File) {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  return (
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  );
}

export async function createPreviewBlob(
  file: File,
  signal: AbortSignal,
  getPriority?: () => number,
): Promise<Blob> {
  signal.throwIfAborted();
  if (!isHeicFile(file)) return file;

  return heicPreviewQueue.enqueue(
    async () => {
      const mode = getHeicPreviewDecoderMode();
      let bitmap: ImageBitmap;
      if (mode === 'wasm') {
        const { decodeHeicWithWasm } = await loadWasmModule();
        signal.throwIfAborted();
        bitmap = await decodeHeicWithWasm(file, signal);
      } else {
        const { heicTo } = await loadHeicModule();
        signal.throwIfAborted();
        bitmap = await heicTo({ blob: file, type: 'bitmap' });
      }

      return createThumbnailBlob(bitmap, signal);
    },
    signal,
    getPriority,
  );
}
