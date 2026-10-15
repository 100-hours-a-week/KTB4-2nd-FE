import { describe, expect, it } from 'vitest';

import type { TripEditData } from '../api/getTripForEdit';
import { getTripUpdateRequest, hasTripEditChanges } from './useTripEditSubmit';
import type { TripCreateFormValues } from './types';

const initial: TripEditData = {
  tripId: 7,
  tripName: '제주 여행',
  startDate: '2026-10-01',
  endDate: '2026-10-03',
  places: [
    { regionCode: '50110', regionName: '제주시' },
    { regionCode: '50130', regionName: '서귀포시' },
  ],
  photoCount: 1,
  photos: [{ id: 101, thumbnailUrl: null }],
};

function values(patch: Partial<TripCreateFormValues> = {}): TripCreateFormValues {
  return {
    tripName: initial.tripName,
    places: initial.places,
    startDate: initial.startDate,
    endDate: initial.endDate,
    attachments: [],
    ...patch,
  };
}

describe('getTripUpdateRequest', () => {
  it('바뀐 값만 담는다', () => {
    expect(getTripUpdateRequest(initial, values())).toBeNull();
    expect(getTripUpdateRequest(initial, values({ tripName: '부산 여행' }))).toEqual({
      tripName: '부산 여행',
    });
    expect(getTripUpdateRequest(initial, values({ endDate: '2026-10-04' }))).toEqual({
      endDate: '2026-10-04',
    });
  });

  it('지역은 순서까지 같아야 그대로로 보고, 바뀌면 전체 지역 코드를 보낸다', () => {
    expect(
      getTripUpdateRequest(initial, values({ places: [...initial.places].reverse() })),
    ).toEqual({ regionCodes: ['50130', '50110'] });
    expect(getTripUpdateRequest(initial, values({ places: [initial.places[0]] }))).toEqual({
      regionCodes: ['50110'],
    });
  });
});

describe('hasTripEditChanges', () => {
  it('정보, 사진 삭제, 사진 추가 중 하나라도 있으면 변경으로 본다', () => {
    expect(hasTripEditChanges(initial, { values: values(), removedPhotoIds: [] })).toBe(false);
    expect(hasTripEditChanges(initial, { values: values(), removedPhotoIds: [101] })).toBe(true);
    expect(
      hasTripEditChanges(initial, {
        values: values({ attachments: [new File(['a'], 'a.jpg', { type: 'image/jpeg' })] }),
        removedPhotoIds: [],
      }),
    ).toBe(true);
  });
});
