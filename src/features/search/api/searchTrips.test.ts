import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { searchTrips } from './searchTrips';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('searchTrips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('검색어로 검색 API를 호출하고 응답을 화면에서 쓰는 모양으로 바꾼다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'SEARCH_SUCCESS',
        data: {
          query: '제주 바다',
          answer: '2026년 8월 25일 화요일이에요.',
          answerError: null,
          folders: [
            {
              tripId: 1,
              tripName: '제주도 가을 여행',
              startDate: '2026-08-24',
              endDate: '2026-08-27',
              regionNames: ['제주시'],
              attachmentCount: 128,
              thumbnailUrl: 'https://cdn.test/trip-1',
              score: 0.9,
            },
          ],
          attachments: [
            {
              tripAttachmentId: 3,
              tripId: 1,
              tripPlaceId: 9,
              thumbnailUrl: 'https://cdn.test/photo-3',
              score: 0.8,
            },
          ],
        },
      },
    });

    await expect(searchTrips('제주 바다')).resolves.toEqual({
      query: '제주 바다',
      answer: '2026년 8월 25일 화요일이에요.',
      answerError: null,
      folders: [
        {
          tripId: 1,
          tripName: '제주도 가을 여행',
          startDate: '2026-08-24',
          endDate: '2026-08-27',
          regionNames: ['제주시'],
          photoCount: 128,
          thumbnailUrl: 'https://cdn.test/trip-1',
        },
      ],
      photos: [
        {
          id: 3,
          tripId: 1,
          tripPlaceId: 9,
          thumbnailUrl: 'https://cdn.test/photo-3',
          accent: 'coast',
        },
      ],
    });
    expect(apiClient.get).toHaveBeenCalledWith('/search', { params: { query: '제주 바다' } });
  });
});
