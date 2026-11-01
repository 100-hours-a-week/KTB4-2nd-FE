import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getFavoriteTrips } from './getFavoriteTrips';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getFavoriteTrips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('즐겨찾기 목록을 커서와 함께 요청해 여행 카드 형태로 바꾼다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'FAVORITE_TRIP_LIST_FOUND',
        data: {
          totalCount: 11,
          items: [
            {
              tripId: 7,
              tripName: '제주 한 바퀴',
              startDate: '2026-09-01',
              endDate: '2026-09-03',
              attachmentCount: 12,
              thumbnailUrl: 'https://cdn.test/7.jpg',
              isFavorite: true,
            },
          ],
          hasNext: true,
          nextCursor: 'next',
        },
      },
    });

    await expect(getFavoriteTrips('cursor-1')).resolves.toEqual({
      trips: [
        {
          id: 7,
          name: '제주 한 바퀴',
          locations: [],
          startDate: '2026-09-01',
          endDate: '2026-09-03',
          nights: 2,
          photoCount: 12,
          favorite: true,
          processingStatus: 'ready',
          thumbnailUrl: 'https://cdn.test/7.jpg',
        },
      ],
      totalCount: 11,
      hasNext: true,
      nextCursor: 'next',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/trips/favorites', {
      params: { cursor: 'cursor-1' },
    });
  });

  it('첫 페이지는 커서 없이 요청한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { totalCount: 0, items: [], hasNext: false, nextCursor: null } },
    });

    await getFavoriteTrips(null);

    expect(apiClient.get).toHaveBeenCalledWith('/trips/favorites', { params: undefined });
  });
});
