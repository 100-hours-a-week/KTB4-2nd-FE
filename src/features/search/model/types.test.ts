import { describe, expect, it } from 'vitest';

import { isSearchableQuery, normalizeSearchQuery } from './types';

describe('검색어 정리', () => {
  it('보이지 않는 문자만 있는 검색어는 빈 값이 되어 검색하지 않는다', () => {
    const query = normalizeSearchQuery('ㅤㅤ');
    expect(query).toBe('');
    expect(isSearchableQuery(query)).toBe(false);
  });

  it('이모지 1개는 1글자라 최소 2글자 조건을 통과하지 못한다', () => {
    expect(isSearchableQuery('🌊')).toBe(false);
    expect(isSearchableQuery('🌊🌊')).toBe(true);
    expect(isSearchableQuery('제주')).toBe(true);
  });

  it('최대 100글자로 자를 때 이모지를 반쪽으로 남기지 않는다', () => {
    const query = normalizeSearchQuery(`${'가'.repeat(99)}🌊🌊`);
    expect(query.endsWith('🌊')).toBe(true);
    expect(Array.from(query)).toHaveLength(100);
  });
});
