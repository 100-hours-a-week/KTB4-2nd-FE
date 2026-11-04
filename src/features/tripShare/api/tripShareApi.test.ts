import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { createTripShare } from './createTripShare';
import { getTripShares } from './getTripShares';
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

  it('커서로 공유 대상자 목록을 받고, 다음 페이지가 없으면 커서를 비운다', async () => {
    const item = {
      tripShareId: 3,
      granteeUserId: 12,
      email: 'hazel@gmail.com',
      permission: 'READ',
      expiresAt: '2026-10-30T15:20:00+09:00',
    };
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({
        data: { data: { items: [item], hasNext: true, nextCursor: 'cursor-1' } },
      })
      .mockResolvedValueOnce({
        data: { data: { items: [], hasNext: false, nextCursor: 'stale' } },
      });

    await expect(getTripShares(7, null)).resolves.toEqual({
      shares: [item],
      nextCursor: 'cursor-1',
    });
    expect(apiClient.get).toHaveBeenLastCalledWith('/trips/7/shares', { params: undefined });

    await expect(getTripShares(7, 'cursor-1')).resolves.toEqual({ shares: [], nextCursor: null });
    expect(apiClient.get).toHaveBeenLastCalledWith('/trips/7/shares', {
      params: { cursor: 'cursor-1' },
    });
  });
});
