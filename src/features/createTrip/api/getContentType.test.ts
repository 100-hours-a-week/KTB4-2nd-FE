import { describe, expect, it } from 'vitest';

import { getContentType } from './uploadInitialAttachments';

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0];
const HEIC_HEADER = [0, 0, 0, 0x18, ...'ftypheic'].map((value) =>
  typeof value === 'string' ? value.charCodeAt(0) : value,
);

function fileOf(bytes: number[], name: string, type = '') {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('getContentType', () => {
  it('확장자가 .jpg여도 내용이 PNG면 image/png로 판별한다', async () => {
    await expect(getContentType(fileOf(PNG_HEADER, 'renamed.jpg', 'image/jpeg'))).resolves.toBe(
      'image/png',
    );
  });

  it('확장자가 .png여도 내용이 JPEG면 image/jpeg로 판별한다', async () => {
    await expect(getContentType(fileOf(JPEG_HEADER, 'renamed.png', 'image/png'))).resolves.toBe(
      'image/jpeg',
    );
  });

  it('HEIC 내용은 image/heic로 판별한다', async () => {
    await expect(getContentType(fileOf(HEIC_HEADER, 'photo.jpg'))).resolves.toBe('image/heic');
  });

  it('내용으로 판별하지 못하면 확장자로 정한다', async () => {
    await expect(getContentType(fileOf([1, 2, 3], 'photo.HEIC'))).resolves.toBe('image/heic');
  });
});
