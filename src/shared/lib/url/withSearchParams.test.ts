import { describe, expect, it } from 'vitest';

import { withSearchParams } from './withSearchParams';

describe('withSearchParams', () => {
  it('받은 쿼리를 경로 뒤에 그대로 붙인다', () => {
    expect(
      withSearchParams('/trips/3/places/10/photos', { place: '제주시', trip: '가을 여행' }),
    ).toBe(
      `/trips/3/places/10/photos?place=${encodeURIComponent('제주시')}&trip=%EA%B0%80%EC%9D%84+%EC%97%AC%ED%96%89`,
    );
  });

  it('쿼리가 없으면 경로만 돌려준다', () => {
    expect(withSearchParams('/trips/3/unclassified', {})).toBe('/trips/3/unclassified');
  });
});
