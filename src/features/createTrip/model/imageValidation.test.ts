import { describe, expect, it } from 'vitest';

import {
  TRIP_IMAGE_MAX_COUNT,
  TRIP_IMAGE_MAX_SIZE,
  validateImageSelection,
} from './imageValidation';

function createFile(name: string, type: string, size = 1) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('여행 사진 선택 검증', () => {
  it('지원 형식의 사진은 기존 목록 뒤에 추가한다', () => {
    const existing = [createFile('first.jpg', 'image/jpeg')];
    const selected = [createFile('second.heic', 'image/heic')];

    expect(validateImageSelection(existing, selected)).toEqual({
      ok: true,
      files: [...existing, ...selected],
    });
  });

  it('지원하지 않는 파일이 섞이면 선택한 묶음 전체를 거부한다', () => {
    const result = validateImageSelection(
      [],
      [createFile('photo.png', 'image/png'), createFile('document.pdf', 'application/pdf')],
    );

    expect(result).toEqual({
      ok: false,
      message: 'JPG, PNG, HEIC 형식의 사진만 선택할 수 있어요.',
    });
  });

  it('장당 용량과 전체 사진 수 제한을 검사한다', () => {
    expect(
      validateImageSelection([], [createFile('large.jpg', 'image/jpeg', TRIP_IMAGE_MAX_SIZE + 1)]),
    ).toMatchObject({ ok: false, message: '사진 한 장의 용량은 15MB를 넘을 수 없어요.' });

    const existing = Array.from({ length: TRIP_IMAGE_MAX_COUNT }, (_, index) =>
      createFile(`${index}.jpg`, 'image/jpeg'),
    );
    expect(validateImageSelection(existing, [createFile('extra.jpg', 'image/jpeg')])).toMatchObject(
      {
        ok: false,
        message: '사진은 최대 200장까지 선택할 수 있어요.',
      },
    );
  });
});
