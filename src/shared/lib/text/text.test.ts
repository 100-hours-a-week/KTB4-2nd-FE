import { describe, expect, it } from 'vitest';

import { countChars, hasVisibleText, normalizeText, sliceChars } from './text';

describe('text 유틸', () => {
  it.each([['ㅤ'], ['⠀⠀'], ['​'], ['﻿ '], ['ㅤ ‍']])(
    '보이지 않는 문자만 있는 %j는 빈 값으로 본다',
    (value) => {
      expect(hasVisibleText(value)).toBe(false);
      expect(normalizeText(value)).toBe('');
    },
  );

  it('앞뒤의 보이지 않는 문자만 지우고 가운데 글자는 남긴다', () => {
    expect(normalizeText('ㅤ 제주 여행​ ')).toBe('제주 여행');
  });

  it('반쪽만 남은 이모지 조각을 지운다', () => {
    expect(normalizeText('제주\uD83D')).toBe('제주');
  });

  it('이모지는 백엔드처럼 코드 포인트 기준 1자로 센다', () => {
    expect('🌊'.length).toBe(2);
    expect(countChars('🌊')).toBe(1);
    expect(countChars('제주🌊')).toBe(3);
  });

  it('최대 글자 수로 자를 때 이모지를 중간에서 끊지 않는다', () => {
    const value = '제주도가을여행기록🌊🌊';
    const sliced = sliceChars(value, 10);
    expect(sliced).toBe('제주도가을여행기록🌊');
    expect(countChars(sliced)).toBe(10);
    expect(normalizeText(sliced)).toBe(sliced);
  });

  it('여러 코드 포인트로 된 이모지는 다 들어가지 않으면 통째로 뺀다', () => {
    // 가족 이모지는 화면에 1글자지만 코드 포인트는 5개입니다.
    expect(sliceChars('여행👨‍👩‍👧', 4)).toBe('여행');
  });
});
