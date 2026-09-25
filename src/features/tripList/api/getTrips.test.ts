import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getTrips } from './getTrips';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getTrips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('목록 응답을 화면에서 쓰는 모양으로 바꿔 반환한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'TRIP_LIST_FOUND',
        data: {
          items: [
            {
              tripId: 7,
              tripName: '제주 여행',
              startDate: '2026-09-01',
              endDate: '2026-09-03',
              placeSummary: '제주시, 서귀포',
              attachmentCount: 3,
              isFavorite: true,
              thumbnailUrl: 'https://cdn.test/7',
            },
          ],
          hasNext: true,
          nextCursor: 'next-cursor',
        },
      },
    });

    await expect(getTrips({ sort: 'LATEST', favorite: false })).resolves.toEqual({
      trips: [
        {
          id: 7,
          name: '제주 여행',
          locations: ['제주시', '서귀포'],
          startDate: '2026-09-01',
          endDate: '2026-09-03',
          nights: 2,
          photoCount: 3,
          favorite: true,
          processingStatus: 'ready',
          thumbnailUrl: 'https://cdn.test/7',
        },
      ],
      hasNext: true,
      nextCursor: 'next-cursor',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/trips', {
      params: { sort: 'LATEST', favorite: 'false' },
    });
  });

  it('커서와 즐겨찾기 필터를 문자열 파라미터로 보낸다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { message: 'TRIP_LIST_FOUND', data: { items: [], hasNext: false, nextCursor: null } },
    });

    await getTrips({ sort: 'OLDEST', favorite: true, cursor: 'cursor-1' });

    expect(apiClient.get).toHaveBeenCalledWith('/trips', {
      params: { sort: 'OLDEST', favorite: 'true', cursor: 'cursor-1' },
    });
  });

  it('장소 요약이 비어 있으면 장소 목록도 비운다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'TRIP_LIST_FOUND',
        data: {
          items: [
            {
              tripId: 1,
              tripName: '당일 여행',
              startDate: '2026-09-01',
              endDate: '2026-09-01',
              placeSummary: '',
              attachmentCount: 0,
              isFavorite: false,
              thumbnailUrl: null,
            },
          ],
          hasNext: false,
          nextCursor: null,
        },
      },
    });

    const { trips } = await getTrips({ sort: 'LATEST', favorite: false });

    expect(trips[0].locations).toEqual([]);
    expect(trips[0].nights).toBe(0);
  });
});
