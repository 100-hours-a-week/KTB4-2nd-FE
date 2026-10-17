import { expect, it } from 'vitest';

import { hasAnyPhotoLocation } from './hasAnyPhotoLocation';

const text = (value: string) => new TextEncoder().encode(value);

function concat(...parts: Uint8Array[]) {
  const bytes = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

function integers(width: 2 | 4, ...values: number[]) {
  const bytes = new Uint8Array(width * values.length);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => {
    if (width === 2) view.setUint16(index * width, value);
    else view.setUint32(index * width, value);
  });
  return bytes;
}

const u16 = (...values: number[]) => integers(2, ...values);
const u32 = (...values: number[]) => integers(4, ...values);
const box = (type: string, ...parts: Uint8Array[]) => {
  const payload = concat(...parts);
  return concat(u32(payload.length + 8), text(type), payload);
};

// GPS 읽기 전용 메타데이터 fixture입니다. 실제 사진이나 사용자의 좌표는 포함하지 않습니다.
function gpsTiff() {
  return concat(
    text('MM'),
    u16(42),
    u32(8),
    u16(1),
    u16(0x8825, 4),
    u32(1, 26, 0),
    u16(4),
    u16(1, 2),
    u32(2),
    text('N\0\0\0'),
    u16(2, 5),
    u32(3, 80),
    u16(3, 2),
    u32(2),
    text('E\0\0\0'),
    u16(4, 5),
    u32(3, 104, 0),
    u32(37, 1, 0, 1, 0, 1),
    u32(127, 1, 0, 1, 0, 1),
  );
}

function heicMetadata(ftypLength: number) {
  const brands = Array.from({ length: (ftypLength - 16) / 4 }, () => text('mif1'));
  brands[brands.length - 1] = text('heic');
  const ftyp = box('ftyp', text('mif1'), u32(0), ...brands);
  const exif = concat(u32(0), gpsTiff());
  const iinf = box('iinf', u32(0), u16(1), box('infe', u32(2 << 24), u16(1, 0), text('Exif\0')));
  const meta = (offset: number) =>
    box(
      'meta',
      u32(0),
      iinf,
      box('iloc', u32(0), new Uint8Array([0x44, 0]), u16(1, 1, 0, 1), u32(offset, exif.length)),
    );
  return concat(ftyp, meta(ftyp.length + meta(0).length + 8), box('mdat', exif));
}

it.each([20, 52, 64, 128])('%s바이트 ftyp의 HEIC에서 실제 exifr로 GPS를 읽는다', async (length) => {
  const bytes = heicMetadata(length);
  const file = new File([bytes], 'metadata.heic', { type: 'image/heic' });
  await expect(hasAnyPhotoLocation([file])).resolves.toBe(true);
});

it('기존 JPEG GPS 검사도 유지한다', async () => {
  const app1 = concat(text('Exif\0\0'), gpsTiff());
  const bytes = concat(
    new Uint8Array([0xff, 0xd8, 0xff, 0xe1]),
    u16(app1.length + 2),
    app1,
    u16(0xffd9),
  );
  await expect(
    hasAnyPhotoLocation([new File([bytes], 'metadata.jpg', { type: 'image/jpeg' })]),
  ).resolves.toBe(true);
});

it('정상 HEIC에 GPS가 없는 경우는 읽기 실패와 구분한다', async () => {
  const bytes = concat(
    box('ftyp', text('heic'), u32(0), ...Array.from({ length: 9 }, () => text('mif1'))),
    box('meta', u32(0)),
  );
  await expect(
    hasAnyPhotoLocation([new File([bytes], 'no-gps.heic', { type: 'image/heic' })]),
  ).resolves.toBe(false);
});

it.each(['wrong-box', 'out-of-bounds', 'unaligned', 'unknown-brand'])(
  '잘못된 HEIC 헤더(%s)는 위치 정보가 있다고 인정하지 않는다',
  async (kind) => {
    const bytes = heicMetadata(52);
    if (kind === 'wrong-box') bytes.set(text('free'), 4);
    if (kind === 'out-of-bounds') new DataView(bytes.buffer).setUint32(0, bytes.length + 4);
    if (kind === 'unaligned') new DataView(bytes.buffer).setUint32(0, 51);
    if (kind === 'unknown-brand') bytes.set(text('nope'), 48);
    await expect(
      hasAnyPhotoLocation([new File([bytes], 'bad.heic', { type: 'image/heic' })]),
    ).rejects.toThrow('사진의 위치 정보를 확인하지 못했어요.');
  },
);
