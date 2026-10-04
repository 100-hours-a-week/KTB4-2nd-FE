import type { HeifImage, LibheifModule } from 'libheif-js/libheif-wasm/libheif-bundle.mjs';

export async function decodeHeicPixels(
  libheif: LibheifModule,
  buffer: ArrayBuffer,
): Promise<ImageData> {
  const decoder = new libheif.HeifDecoder();
  let images: HeifImage[] = [];

  try {
    images = decoder.decode(buffer);
    const image = images[0];
    if (!image) throw new Error('HEIC 사진을 찾을 수 없습니다.');

    const width = image.get_width();
    const height = image.get_height();
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error('HEIC 이미지 크기가 유효하지 않습니다.');
    }

    const imageData = new ImageData(width, height);
    // Keep the full-resolution RGBA path identical to heic-to; resizing stays on Main.
    for (let index = 3; index < imageData.data.length; index += 4) {
      imageData.data[index] = 255;
    }

    return await new Promise<ImageData>((resolve, reject) => {
      image.display(imageData, (result) => {
        if (result) resolve(result);
        else reject(new Error('HEIC 픽셀을 디코딩할 수 없습니다.'));
      });
    });
  } finally {
    for (const image of images) image.free();
    if (decoder.decoder) {
      libheif.heif_context_free(decoder.decoder);
      decoder.decoder = null;
    }
  }
}
