import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getFavoriteTripCount } from './getFavoriteTripCount';
import { getUserStats } from './getUserStats';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('userStats api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('마이페이지 통계를 조회해 화면에서 쓰는 이름으로 바꾼다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'USER_STATS_FOUND',
        data: {
          tripCount: 4,
          attachmentCount: 853,
          storyCount: 2,
          storageUsedBytes: 12_400_000_000,
          storageMaximumBytes: 30_000_000_000,
        },
      },
    });

    await expect(getUserStats()).resolves.toEqual({
      tripCount: 4,
      photoCount: 853,
      storyCount: 2,
      storageUsedBytes: 12_400_000_000,
      storageLimitBytes: 30_000_000_000,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/users/me/stats');
  });

  it('즐겨찾기 목록 응답의 전체 개수를 돌려준다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'FAVORITE_TRIP_LIST_FOUND',
        data: { totalCount: 3, items: [], hasNext: false, nextCursor: null },
      },
    });

    await expect(getFavoriteTripCount()).resolves.toBe(3);
    expect(apiClient.get).toHaveBeenCalledWith('/trips/favorites');
  });
});
