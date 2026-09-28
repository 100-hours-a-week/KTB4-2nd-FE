import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { cancelTripProcessing } from './cancelTripProcessing';

vi.mock('@/shared/api/browser', () => ({ apiClient: { delete: vi.fn() } }));

describe('cancelTripProcessing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('CSRF 토큰을 실어 사진 정리 취소를 요청한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ status: 204 });

    await cancelTripProcessing(7, 'csrf-token');

    expect(apiClient.delete).toHaveBeenCalledWith('/trips/7/processing', {
      headers: { 'X-CSRF-TOKEN': 'csrf-token' },
    });
  });
});
