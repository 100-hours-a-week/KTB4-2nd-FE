import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { registerTripFavorite, removeTripFavorite } from './tripFavorite';

vi.mock('@/shared/api/browser', () => ({ apiClient: { post: vi.fn(), delete: vi.fn() } }));

describe('tripFavorite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('즐겨찾기를 등록하고 결과를 반환한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: 'FAVORITE_REGISTERED', data: { tripId: 7, isFavorite: true } },
    });

    await expect(registerTripFavorite(7, 'csrf-token')).resolves.toEqual({
      tripId: 7,
      isFavorite: true,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/trips/7/favorite', null, {
      headers: { 'X-CSRF-TOKEN': 'csrf-token' },
    });
  });

  it('즐겨찾기를 해제한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await removeTripFavorite(7, 'csrf-token');

    expect(apiClient.delete).toHaveBeenCalledWith('/trips/7/favorite', {
      headers: { 'X-CSRF-TOKEN': 'csrf-token' },
    });
  });
});
