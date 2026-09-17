import { describe, expect, it } from 'vitest';

import { validateNickname } from './nickname';

describe('validateNickname', () => {
  it.each([
    ['', '닉네임을 입력해주세요.'],
    ['여', '2자 이상 입력해주세요.'],
    ['여 담', '공백과 특수문자는 쓸 수 없어요.'],
    ['여담!', '공백과 특수문자는 쓸 수 없어요.'],
    ['12345678901', '최대 10자까지 입력할 수 있어요.'],
  ])('%s를 검증한다', (value, message) => {
    expect(validateNickname(value)).toBe(message);
  });

  it.each(['여담', 'yeodam', '여담2026'])('%s를 허용한다', (value) => {
    expect(validateNickname(value)).toBe(true);
  });
});
