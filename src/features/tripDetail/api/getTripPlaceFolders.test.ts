import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { getTripPlaceFolders } from './getTripPlaceFolders';

vi.mock('@/shared/api/browser', () => ({ apiClient: { get: vi.fn() } }));

describe('getTripPlaceFolders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('장소 폴더 응답을 화면에서 쓰는 모양으로 바꿔 반환한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'PLACE_FOLDER_LIST_FOUND',
        data: {
          items: [
            {
              tripPlaceId: 11,
              placeName: '서귀포',
              attachmentCount: 35,
              thumbnailUrl: 'https://cdn.test/11',
            },
            { tripPlaceId: 12, placeName: '우도', attachmentCount: 0, thumbnailUrl: null },
          ],
          hasNext: true,
          nextCursor: 'next-cursor',
        },
      },
    });

    await expect(getTripPlaceFolders(7)).resolves.toEqual({
      folders: [
        {
          id: 11,
          name: '서귀포',
          photoCount: 35,
          thumbnailUrl: 'https://cdn.test/11',
          accent: 'coast',
        },
        { id: 12, name: '우도', photoCount: 0, thumbnailUrl: null, accent: 'sunset' },
      ],
      hasNext: true,
      nextCursor: 'next-cursor',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/trips/7/place-folders', { params: undefined });
  });

  it('커서가 있으면 쿼리 파라미터로 보낸다', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        message: 'PLACE_FOLDER_LIST_FOUND',
        data: { items: [], hasNext: false, nextCursor: null },
      },
    });

    await getTripPlaceFolders(7, 'cursor-1');

    expect(apiClient.get).toHaveBeenCalledWith('/trips/7/place-folders', {
      params: { cursor: 'cursor-1' },
    });
  });
});
