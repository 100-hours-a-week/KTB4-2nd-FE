import { describe, expect, it } from 'vitest';

import { groupNearbyTripMarkers, type TripMapMarker } from './tripMapMarker';

const marker = (tripId: number, longitude: number, tripCount = 1): TripMapMarker => ({
  regionCode: String(tripId),
  regionName: `지역 ${tripId}`,
  latitude: 37,
  longitude,
  tripCount,
  trips: [{ tripId, tripName: `여행 ${tripId}`, thumbnailUrl: null, attachmentCount: 0 }],
});

describe('groupNearbyTripMarkers', () => {
  it('화면에서 겹치는 지역 마커를 묶고 서버의 여행 수를 합산한다', () => {
    const groups = groupNearbyTripMarkers(
      [marker(2, 20, 2), marker(1, 0), marker(3, 100)],
      (item) => ({ x: item.longitude, y: item.latitude }),
    );

    expect(groups).toHaveLength(2);
    expect(groups[0].tripCount).toBe(3);
    expect(groups[0].trips.map((item) => item.tripId)).toEqual([2, 1]);
    expect(groups[1].trips.map((item) => item.tripId)).toEqual([3]);
  });
});
