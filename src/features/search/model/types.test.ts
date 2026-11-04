import { describe, expect, it } from 'vitest';

import {
  groupSearchPhotosByTrip,
  isSearchableQuery,
  normalizeSearchQuery,
  type SearchPhoto,
} from './types';

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

describe('groupSearchPhotosByTrip', () => {
  const photo = (id: number, tripId: number, tripName: string): SearchPhoto => ({
    id,
    tripId,
    tripName,
    tripPlaceId: tripId * 10,
    thumbnailUrl: null,
    accent: 'coast',
  });

  it('검색 순서를 지키며 같은 여행 폴더의 사진끼리 묶는다', () => {
    const groups = groupSearchPhotosByTrip([
      photo(1, 2, '부산 여행'),
      photo(2, 1, '제주 여행'),
      photo(3, 2, '부산 여행'),
    ]);

    expect(groups.map((group) => group.tripName)).toEqual(['부산 여행', '제주 여행']);
    expect(groups[0].photos.map((item) => item.id)).toEqual([1, 3]);
    expect(groups[1].photos.map((item) => item.id)).toEqual([2]);
  });
});
