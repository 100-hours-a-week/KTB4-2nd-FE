import { beforeEach, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getTripForEdit } from './getTripForEdit';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

function editResponse(items: number[], nextCursor: string | null) {
  return {
    data: {
      data: {
        tripId: 7,
        tripName: '제주 여행',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        regions: [{ regionId: 1, regionCode: '50110', regionName: '제주시' }],
        attachmentCount: 3,
        attachments: {
          items: items.map((id) => ({ tripAttachmentId: id, thumbnailUrl: `https://cdn/${id}` })),
          hasNext: nextCursor !== null,
          nextCursor,
        },
      },
    },
  };
}

beforeEach(() => vi.clearAllMocks());

it('수정용 여행 정보를 폼 값으로 바꾸고 기존 사진은 다음 페이지까지 모두 받는다', async () => {
  vi.mocked(apiClient.get)
    .mockResolvedValueOnce(editResponse([1, 2], 'next'))
    .mockResolvedValueOnce(editResponse([3], null));

  await expect(getTripForEdit(7)).resolves.toEqual({
    tripId: 7,
    tripName: '제주 여행',
    startDate: '2026-10-01',
    endDate: '2026-10-03',
    places: [{ regionCode: '50110', regionName: '제주시' }],
    photoCount: 3,
    photos: [1, 2, 3].map((id) => ({ id, thumbnailUrl: `https://cdn/${id}` })),
  });
  expect(apiClient.get).toHaveBeenNthCalledWith(1, '/trips/7/edit', { params: undefined });
  expect(apiClient.get).toHaveBeenNthCalledWith(2, '/trips/7/edit', { params: { cursor: 'next' } });
});
