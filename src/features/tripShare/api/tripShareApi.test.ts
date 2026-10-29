import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { createTripShare } from './createTripShare';
import { searchShareUser } from './searchShareUser';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

describe('tripShare api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('이메일을 쿼리로 보내 공유 대상자를 검색한다', async () => {
    const user = { userId: 12, nickname: '헤이즐', email: 'hazel@gmail.com' };
    vi.mocked(apiClient.get).mockResolvedValue({ data: { message: 'USER_FOUND', data: user } });

    await expect(searchShareUser('hazel@gmail.com')).resolves.toEqual(user);
    expect(apiClient.get).toHaveBeenCalledWith('/users/search', {
      params: { email: 'hazel@gmail.com' },
    });
  });

  it('CSRF 토큰과 함께 공유 대상자를 등록한다', async () => {
    const share = {
      tripShareId: 3,
      granteeUserId: 12,
      permission: 'READ',
      expiresAt: '2026-10-30T15:20:00+09:00',
    };
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { message: 'TRIP_SHARE_CREATE_SUCCESS', data: share },
    });

    await expect(
      createTripShare(7, { granteeUserId: 12, permission: 'READ' }, 'csrf-token'),
    ).resolves.toEqual(share);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/trips/7/shares',
      { granteeUserId: 12, permission: 'READ' },
      { headers: { 'X-CSRF-TOKEN': 'csrf-token' } },
    );
  });
});
