import { describe, expect, it } from 'vitest';

import { placePhotosHref } from './placePhotosHref';

describe('placePhotosHref', () => {
  it('장소 이름을 몰라도 아는 여행 이름은 넘긴다', () => {
    expect(placePhotosHref({ tripId: 1, tripPlaceId: 9, tripName: '제주 여행' })).toBe(
      `/trips/1/places/9/photos?trip=${encodeURIComponent('제주 여행')}`,
    );
  });

  it('아는 이름이 없으면 경로만 돌려준다', () => {
    expect(placePhotosHref({ tripId: 1, tripPlaceId: 9 })).toBe('/trips/1/places/9/photos');
  });
});
