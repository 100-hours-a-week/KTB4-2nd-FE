import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getAiStatus } from './getAiStatus';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getAiStatus', () => {
  it('AI 서버 상태 API를 호출해 running과 ready를 그대로 반환한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { message: 'RUNPOD_STATUS_FOUND', data: { running: null, ready: true } },
    });

    await expect(getAiStatus()).resolves.toEqual({ running: null, ready: true });
    expect(apiClient.get).toHaveBeenCalledWith('/ai/runpod/status');
  });
});
