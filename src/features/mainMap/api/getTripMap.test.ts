import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getTripMap } from './getTripMap';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getTripMap', () => {
  beforeEach(() => vi.clearAllMocks());

  it('지도 API의 지역 마커를 반환한다', async () => {
    const markers = [
      {
        regionCode: '50110',
        regionName: '제주특별자치도 제주시',
        latitude: 33.4996,
        longitude: 126.5312,
        tripCount: 2,
        trips: [
          {
            tripId: 1,
            tripName: '제주도 가을 여행',
            thumbnailUrl: 'https://example.com/photo.jpg',
            attachmentCount: 128,
          },
        ],
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { message: 'TRIP_MAP_FOUND', data: { markers } },
    });

    await expect(getTripMap()).resolves.toEqual(markers);
    expect(apiClient.get).toHaveBeenCalledWith('/trips/map');
  });
});
