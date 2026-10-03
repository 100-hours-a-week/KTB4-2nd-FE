// 약 130px 정사각형 카드에 표시할 미리보기를 2배 해상도로 준비한다.
const PREVIEW_EDGE = 260;
const JPEG_QUALITY = 0.85;

function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 1;
  canvas.height = 1;
}

function drawThumbnail(bitmap: ImageBitmap, signal: AbortSignal) {
  let canvas: HTMLCanvasElement | null = null;

  try {
    signal.throwIfAborted();

    const sourceEdge = Math.min(bitmap.width, bitmap.height);
    if (sourceEdge <= 0) throw new Error('미리보기 이미지 크기가 유효하지 않습니다.');

    canvas = document.createElement('canvas');
    const previewEdge = Math.min(PREVIEW_EDGE, sourceEdge);
    canvas.width = previewEdge;
    canvas.height = previewEdge;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('미리보기 Canvas를 생성할 수 없습니다.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      bitmap,
      (bitmap.width - sourceEdge) / 2,
      (bitmap.height - sourceEdge) / 2,
      sourceEdge,
      sourceEdge,
      0,
      0,
      previewEdge,
      previewEdge,
    );

    return canvas;
  } catch (error) {
    if (canvas) releaseCanvas(canvas);
    throw error;
  } finally {
    bitmap.close();
  }
}

export async function createThumbnailBlob(bitmap: ImageBitmap, signal: AbortSignal): Promise<Blob> {
  const canvas = drawThumbnail(bitmap, signal);

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error('미리보기 JPEG를 생성할 수 없습니다.'));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    });

    signal.throwIfAborted();
    return blob;
  } finally {
    releaseCanvas(canvas);
  }
}
