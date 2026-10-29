import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getTripPlaceMap } from './getTripPlaceMap';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getTripPlaceMap', () => {
  beforeEach(() => vi.clearAllMocks());

  it('여행 상세 지도 마커를 장소 핀 모양으로 바꿔 반환한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'TRIP_DETAIL_MAP_FOUND',
        data: {
          tripId: 7,
          markers: [
            {
              tripPlaceId: 11,
              placeName: '성산일출봉',
              latitude: 33.4581,
              longitude: 126.9425,
              attachmentCount: 15,
              thumbnailUrl: 'https://cdn.test/11',
            },
            {
              tripPlaceId: 12,
              placeName: '우도',
              latitude: '33.50630000',
              longitude: '126.95300000',
              attachmentCount: 28,
              thumbnailUrl: null,
            },
          ],
        },
      },
    });

    await expect(getTripPlaceMap(7)).resolves.toEqual([
      {
        id: 11,
        name: '성산일출봉',
        latitude: 33.4581,
        longitude: 126.9425,
        photoCount: 15,
        thumbnailUrl: 'https://cdn.test/11',
      },
      {
        id: 12,
        name: '우도',
        latitude: 33.5063,
        longitude: 126.953,
        photoCount: 28,
        thumbnailUrl: null,
      },
    ]);
    expect(apiClient.get).toHaveBeenCalledWith('/trips/7/map');
  });
});
