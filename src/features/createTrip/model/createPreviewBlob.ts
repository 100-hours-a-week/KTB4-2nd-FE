import { createPreviewConversionQueue } from './previewConversionQueue';
import { createThumbnailBlob } from './createThumbnailBlob';
import { prepareHeicPreviewDecoder, resetHeicPreviewDecoder } from './heicPreviewDecoder';
import { HeicPreviewResourceError } from './heicPreviewError';
import { getHeicWorkerCount } from './heicWorkerCount';

let heicPreviewQueue: ReturnType<typeof createPreviewConversionQueue> | null = null;

function getHeicPreviewQueue() {
  heicPreviewQueue ??= createPreviewConversionQueue(getHeicWorkerCount());
  return heicPreviewQueue;
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

  await prepareHeicPreviewDecoder();
  signal.throwIfAborted();

  return getHeicPreviewQueue().enqueue(
    async () => {
      const decode = await prepareHeicPreviewDecoder();
      signal.throwIfAborted();
      try {
        const bitmap = await decode(file, signal);
        return await createThumbnailBlob(bitmap, signal);
      } catch (error) {
        if (error instanceof HeicPreviewResourceError) resetHeicPreviewDecoder();
        throw error;
      }
    },
    signal,
    getPriority,
  );
}
