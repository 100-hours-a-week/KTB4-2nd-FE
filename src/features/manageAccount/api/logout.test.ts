import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { logout } from './logout';

vi.mock('@/shared/api/browser', () => ({ apiClient: { post: vi.fn() } }));

describe('logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('CSRF 토큰을 실어 로그아웃을 요청한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ status: 204 });

    await logout('csrf-token');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', null, {
      headers: { 'X-CSRF-TOKEN': 'csrf-token' },
      skipAuthRefresh: true,
    });
  });
});
