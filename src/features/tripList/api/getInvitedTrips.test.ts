import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getInvitedTrips } from './getInvitedTrips';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getInvitedTrips', () => {
  beforeEach(() => vi.clearAllMocks());

  it('초대받은 여행을 커서와 함께 요청해 권한이 붙은 여행 카드 형태로 바꾼다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'INVITED_TRIP_LIST_FOUND',
        data: {
          totalCount: 12,
          items: [
            {
              tripId: 7,
              tripName: '파리 & 런던',
              startDate: '2026-11-20',
              endDate: '2026-11-27',
              placeSummary: '파리, 런던',
              attachmentCount: 341,
              thumbnailUrl: 'https://cdn.test/7.jpg',
              permission: 'WRITE',
            },
          ],
          hasNext: true,
          nextCursor: 'next',
        },
      },
    });

    await expect(getInvitedTrips('cursor-1')).resolves.toEqual({
      trips: [
        {
          id: 7,
          name: '파리 & 런던',
          locations: ['파리', '런던'],
          startDate: '2026-11-20',
          endDate: '2026-11-27',
          nights: 7,
          photoCount: 341,
          favorite: false,
          processingStatus: 'ready',
          thumbnailUrl: 'https://cdn.test/7.jpg',
          permission: 'WRITE',
        },
      ],
      totalCount: 12,
      hasNext: true,
      nextCursor: 'next',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/trips/shares', {
      params: { cursor: 'cursor-1' },
    });
  });

  it('첫 페이지는 커서 없이 요청하고, 지역이 없으면 빈 목록으로 둔다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          totalCount: 1,
          items: [
            {
              tripId: 3,
              tripName: '당일치기',
              startDate: '2026-11-01',
              endDate: '2026-11-01',
              placeSummary: '',
              attachmentCount: 0,
              thumbnailUrl: null,
              permission: 'READ',
            },
          ],
          hasNext: false,
          nextCursor: null,
        },
      },
    });

    const result = await getInvitedTrips(null);

    expect(apiClient.get).toHaveBeenCalledWith('/trips/shares', { params: undefined });
    expect(result.trips[0].locations).toEqual([]);
  });
});
