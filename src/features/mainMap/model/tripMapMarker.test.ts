import { describe, expect, it } from 'vitest';

import { groupNearbyTripMarkers, type TripMapMarker } from './tripMapMarker';

const trip = (tripId: number, longitude: number, createdAt: string): TripMapMarker => ({
  tripId,
  title: `여행 ${tripId}`,
  latitude: 37,
  longitude,
  regionName: '서울',
  createdAt,
});

describe('groupNearbyTripMarkers', () => {
  it('겹치는 마커를 한 그룹으로 묶고 오래된 여행부터 정렬한다', () => {
    const groups = groupNearbyTripMarkers(
      [trip(2, 20, '2026-09-02'), trip(1, 0, '2026-09-01'), trip(3, 100, '2026-09-03')],
      (item) => ({ x: item.longitude, y: item.latitude }),
    );

    expect(groups).toHaveLength(2);
    expect(groups[0].trips.map((item) => item.tripId)).toEqual([1, 2]);
    expect(groups[1].trips.map((item) => item.tripId)).toEqual([3]);
  });
});
