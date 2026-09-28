import { describe, expect, it } from 'vitest';

import {
  getTripMarkerThumbnail,
  groupNearbyTripMarkers,
  type TripMapMarker,
  type TripMarkerGroup,
} from './tripMapMarker';

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

describe('getTripMarkerThumbnail', () => {
  const group = (thumbnailUrls: Array<string | null>): TripMarkerGroup => ({
    markers: [],
    trips: thumbnailUrls.map((thumbnailUrl, index) => ({
      tripId: index + 1,
      tripName: `여행 ${index + 1}`,
      thumbnailUrl,
      attachmentCount: thumbnailUrl ? 1 : 0,
    })),
    tripCount: thumbnailUrls.length,
    regionName: '제주',
    latitude: 33.49,
    longitude: 126.53,
  });

  it('첫 여행의 대표 이미지가 없어도 뒤 여행의 대표 이미지를 사용한다', () => {
    expect(getTripMarkerThumbnail(group([null, 'https://cdn.test/trip-2.jpg']))).toBe(
      'https://cdn.test/trip-2.jpg',
    );
  });

  it('모든 여행에 대표 이미지가 없으면 빈 마커를 위해 null을 반환한다', () => {
    expect(getTripMarkerThumbnail(group([null, null]))).toBeNull();
  });
});
