import { createPreviewConversionQueue } from './previewConversionQueue';

export const HEIC_PREVIEW_CONCURRENCY = 2;

const heicPreviewQueue = createPreviewConversionQueue(HEIC_PREVIEW_CONCURRENCY);
let heicModulePromise: Promise<typeof import('heic-to')> | null = null;

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

export async function createPreviewBlob(file: File, signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted();
  if (!isHeicFile(file)) return file;

  return heicPreviewQueue.enqueue(async () => {
    const { heicTo } = await loadHeicModule();
    signal.throwIfAborted();

    return heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.85,
    });
  }, signal);
}
