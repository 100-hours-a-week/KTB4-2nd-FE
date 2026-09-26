import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { withdraw } from './withdraw';

vi.mock('@/shared/api/browser', () => ({ apiClient: { delete: vi.fn() } }));

describe('withdraw', () => {
  beforeEach(() => vi.clearAllMocks());

  it('CSRF 토큰을 실어 회원 탈퇴를 요청한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await withdraw('csrf-token');

    expect(apiClient.delete).toHaveBeenCalledWith('/users/me', {
      headers: { 'X-CSRF-TOKEN': 'csrf-token' },
      skipAuthRefresh: true,
    });
  });
});
