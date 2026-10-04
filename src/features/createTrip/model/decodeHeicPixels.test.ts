import type { HeifImage, LibheifModule } from 'libheif-js/libheif-wasm/libheif-bundle.mjs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { decodeHeicPixels } from './decodeHeicPixels';

beforeEach(() => {
  vi.stubGlobal(
    'ImageData',
    class {
      data: Uint8ClampedArray;
      constructor(
        public width: number,
        public height: number,
      ) {
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

function fixture() {
  const image: HeifImage = {
    get_width: vi.fn(() => 2),
    get_height: vi.fn(() => 1),
    display: vi.fn((pixels, callback) => callback(pixels)),
    free: vi.fn(),
  };
  const extraImage = { ...image, display: vi.fn(), free: vi.fn() };
  const decode = vi.fn(() => [image, extraImage]);
  const context = { decoder: 42, decode };
  const libheif: LibheifModule = {
    HeifDecoder: class {
      constructor() {
        return context;
      }
      decoder = 42;
      decode = decode;
    },
    heif_context_free: vi.fn(),
  };
  return { libheif, image, extraImage, context, decode };
}

it('첫 사진의 원본 크기 RGBA를 얻고 모든 이미지 핸들과 컨텍스트를 해제한다', async () => {
  const { libheif, image, extraImage, context, decode } = fixture();
  const buffer = new ArrayBuffer(4);
  const result = await decodeHeicPixels(libheif, buffer);
  expect(decode).toHaveBeenCalledWith(buffer);
  expect(result.width).toBe(2);
  expect(result.height).toBe(1);
  expect([...result.data]).toEqual([0, 0, 0, 255, 0, 0, 0, 255]);
  expect(image.free).toHaveBeenCalledOnce();
  expect(extraImage.free).toHaveBeenCalledOnce();
  expect(extraImage.display).not.toHaveBeenCalled();
  expect(libheif.heif_context_free).toHaveBeenCalledWith(42);
  expect(context.decoder).toBeNull();
});

it('픽셀 디코딩이 실패해도 이미지와 컨텍스트를 해제한다', async () => {
  const { libheif, image, extraImage } = fixture();
  vi.mocked(image.display).mockImplementation((_, callback) => callback(null));
  await expect(decodeHeicPixels(libheif, new ArrayBuffer(4))).rejects.toThrow('픽셀');
  expect(image.free).toHaveBeenCalledOnce();
  expect(extraImage.free).toHaveBeenCalledOnce();
  expect(libheif.heif_context_free).toHaveBeenCalledOnce();
});

it('사진이 없는 입력도 컨텍스트를 정리한다', async () => {
  const { libheif, decode } = fixture();
  decode.mockReturnValue([]);
  await expect(decodeHeicPixels(libheif, new ArrayBuffer(4))).rejects.toThrow('사진을 찾을');
  expect(libheif.heif_context_free).toHaveBeenCalledOnce();
});

it('잘못된 크기는 픽셀을 할당하지 않고 정리한다', async () => {
  const { libheif, image } = fixture();
  vi.mocked(image.get_width).mockReturnValue(0);
  await expect(decodeHeicPixels(libheif, new ArrayBuffer(4))).rejects.toThrow('크기');
  expect(image.display).not.toHaveBeenCalled();
  expect(image.free).toHaveBeenCalledOnce();
  expect(libheif.heif_context_free).toHaveBeenCalledOnce();
});
