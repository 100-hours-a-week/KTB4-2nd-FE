import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { deleteTrip } from './deleteTrip';

vi.mock('@/shared/api/browser', () => ({ apiClient: { delete: vi.fn() } }));

describe('deleteTrip', () => {
  beforeEach(() => vi.clearAllMocks());

  it('CSRF 토큰을 실어 여행 삭제를 요청한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await deleteTrip(7, 'csrf-token');

    expect(apiClient.delete).toHaveBeenCalledWith('/trips/7', {
      headers: { 'X-CSRF-TOKEN': 'csrf-token' },
    });
  });
});
