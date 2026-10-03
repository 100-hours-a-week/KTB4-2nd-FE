import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createThumbnailBlob } from './createThumbnailBlob';

function createBitmap(width: number, height: number) {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap;
}

describe('createThumbnailBlob', () => {
  const drawImage = vi.fn();
  const context = {
    drawImage,
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
  };
  let canvases: HTMLCanvasElement[];
  let encodedSizes: number[][];
  let preview: Blob;

  beforeEach(() => {
    canvases = [];
    encodedSizes = [];
    preview = new Blob(['small-jpeg'], { type: 'image/jpeg' });
    drawImage.mockReset();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      canvases.push(this);
      return context as unknown as CanvasRenderingContext2D;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
    ) {
      encodedSizes.push([this.width, this.height]);
      callback(preview);
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([
    [4000, 3000, 500, 0, 3000, 260],
    [3000, 4000, 0, 500, 3000, 260],
    [3000, 3000, 0, 0, 3000, 260],
    [200, 100, 50, 0, 100, 100],
  ])(
    '%s×%s 이미지를 중앙에서 잘라 최대 260px로 만들고 작은 원본은 확대하지 않는다',
    async (width, height, sourceX, sourceY, sourceEdge, targetEdge) => {
      const bitmap = createBitmap(width, height);

      expect(await createThumbnailBlob(bitmap, new AbortController().signal)).toBe(preview);
      expect(drawImage).toHaveBeenCalledWith(
        bitmap,
        sourceX,
        sourceY,
        sourceEdge,
        sourceEdge,
        0,
        0,
        targetEdge,
        targetEdge,
      );
      expect(encodedSizes).toEqual([[targetEdge, targetEdge]]);
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.85,
      );
      expect(context.imageSmoothingEnabled).toBe(true);
      expect(context.imageSmoothingQuality).toBe('high');
      expect(bitmap.close).toHaveBeenCalledOnce();
      expect(canvases[0].width).toBe(1);
      expect(canvases[0].height).toBe(1);
    },
  );

  it('JPEG 인코딩을 기다리는 동안 원본 Bitmap은 이미 해제되어 있다', async () => {
    let finish!: BlobCallback;
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => {
      finish = callback;
    });
    const bitmap = createBitmap(4000, 3000);
    const result = createThumbnailBlob(bitmap, new AbortController().signal);

    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(260);
    finish(preview);
    expect(await result).toBe(preview);
    expect(canvases[0].width).toBe(1);
  });

  it('디코딩 후 취소되면 Canvas를 만들지 않고 Bitmap을 해제한다', async () => {
    const controller = new AbortController();
    controller.abort();
    const bitmap = createBitmap(4000, 3000);

    await expect(createThumbnailBlob(bitmap, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(drawImage).not.toHaveBeenCalled();
    expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
    expect(bitmap.close).toHaveBeenCalledOnce();
  });

  it('인코딩 중 취소되면 결과를 반환하지 않고 Canvas를 정리한다', async () => {
    const controller = new AbortController();
    let finish!: BlobCallback;
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => {
      finish = callback;
    });
    const bitmap = createBitmap(4000, 3000);
    const result = createThumbnailBlob(bitmap, controller.signal);
    const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });

    controller.abort();
    finish(preview);
    await assertion;
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(1);
  });

  it('Canvas 컨텍스트를 얻지 못해도 Bitmap과 Canvas를 정리한다', async () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      canvases.push(this);
      return null;
    });
    const bitmap = createBitmap(4000, 3000);

    await expect(createThumbnailBlob(bitmap, new AbortController().signal)).rejects.toThrow(
      '미리보기 Canvas를 생성할 수 없습니다.',
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(1);
    expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
  });

  it('이미지를 그리지 못해도 Bitmap과 Canvas를 정리한다', async () => {
    drawImage.mockImplementationOnce(() => {
      throw new Error('draw 실패');
    });
    const bitmap = createBitmap(4000, 3000);

    await expect(createThumbnailBlob(bitmap, new AbortController().signal)).rejects.toThrow(
      'draw 실패',
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(1);
  });

  it('JPEG 생성 결과가 null이면 실패 처리하고 Canvas를 정리한다', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation((callback) => callback(null));
    const bitmap = createBitmap(4000, 3000);

    await expect(createThumbnailBlob(bitmap, new AbortController().signal)).rejects.toThrow(
      '미리보기 JPEG를 생성할 수 없습니다.',
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(1);
  });

  it('인코딩이 동기 예외를 던져도 Canvas를 정리한다', async () => {
    vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(() => {
      throw new Error('encode 실패');
    });
    const bitmap = createBitmap(4000, 3000);

    await expect(createThumbnailBlob(bitmap, new AbortController().signal)).rejects.toThrow(
      'encode 실패',
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvases[0].width).toBe(1);
  });

  it('유효하지 않은 이미지 크기를 거절하고 Bitmap을 해제한다', async () => {
    const bitmap = createBitmap(0, 3000);

    await expect(createThumbnailBlob(bitmap, new AbortController().signal)).rejects.toThrow(
      '미리보기 이미지 크기가 유효하지 않습니다.',
    );
    expect(bitmap.close).toHaveBeenCalledOnce();
    expect(canvases).toHaveLength(0);
  });
});
