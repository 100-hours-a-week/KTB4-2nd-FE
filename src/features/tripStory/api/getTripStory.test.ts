import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getTripStory } from './getTripStory';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getTripStory', () => {
  beforeEach(() => vi.clearAllMocks());
  it('명세된 엔드포인트를 호출하고 응답의 data를 반환한다', async () => {
    const response = {
      storyId: 1,
      tripId: 7,
      userByMe: true,
      mood: 'EMOTIONAL',
      storySummary: '제주의 바람과 노을',
      days: [],
    };
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { message: 'STORY_FOUND', data: response },
    });
    expect(await getTripStory(7)).toEqual(response);
    expect(apiClient.get).toHaveBeenCalledExactlyOnceWith('/trips/7/story');
  });
});
