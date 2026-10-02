import { describe, expect, it } from 'vitest';

import { getTripRegion } from './getTripRegion';

describe('getTripRegion', () => {
  it('첫 장소에서 시·군·구 단위만 추출한다', () => {
    expect(getTripRegion([{ regionCode: '50110', regionName: '제주특별자치도 제주시' }])).toBe(
      '제주시',
    );
    expect(getTripRegion([{ regionCode: '11680', regionName: '서울특별시 강남구' }])).toBe(
      '강남구',
    );
  });

  it('시·군·구 단위가 없으면 첫 장소 이름을 사용한다', () => {
    expect(getTripRegion([{ regionCode: 'unknown', regionName: '제주도' }])).toBe('제주도');
    expect(getTripRegion([])).toBe('unknown');
  });
});
