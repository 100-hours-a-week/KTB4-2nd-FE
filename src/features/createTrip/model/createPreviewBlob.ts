import { createPreviewConversionQueue } from './previewConversionQueue';

// 전후 비교 시 이 값을 1, 2, 4, Infinity로 바꿔 동일한 조건에서 측정합니다.
export const HEIC_PREVIEW_CONCURRENCY = 2;

// 모든 ImagePreview가 한 큐를 공유해야 전체 동시 실행 수가 제한됩니다.
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
