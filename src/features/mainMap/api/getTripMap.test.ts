import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getTripMap } from './getTripMap';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getTripMap', () => {
  beforeEach(() => vi.clearAllMocks());

  it('지도 API의 여행별 마커를 반환한다', async () => {
    const markers = [
      {
        tripId: 1,
        tripName: '제주도 가을 여행',
        latitude: 33.4996,
        longitude: 126.5312,
        thumbnailUrl: 'https://example.com/photo.jpg',
        attachmentCount: 128,
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { message: 'TRIP_MAP_FOUND', data: { markers } },
    });

    await expect(getTripMap()).resolves.toEqual(markers);
    expect(apiClient.get).toHaveBeenCalledWith('/trips/map');
  });
});
