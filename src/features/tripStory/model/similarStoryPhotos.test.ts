import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getPlacePhotos } from '@/features/photoList/api/getPlacePhotos';

import { getSimilarStoryPhotos } from '../api/getSimilarStoryPhotos';
import { findSimilarStoryPhotos } from './similarStoryPhotos';

vi.mock('../api/getSimilarStoryPhotos', () => ({ getSimilarStoryPhotos: vi.fn() }));
vi.mock('@/features/photoList/api/getPlacePhotos', () => ({ getPlacePhotos: vi.fn() }));

const params = { tripId: 7, tripPlaceId: 3, storyId: 9, storyBlockId: 99 };

function page(ids: number[], nextCursor: string | null) {
  return {
    photos: ids.map((id) => ({
      id,
      thumbnailUrl: `https://cdn.test/${id}`,
      accent: 'coast' as const,
    })),
    hasNext: nextCursor !== null,
    nextCursor,
  };
}

describe('findSimilarStoryPhotos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('비슷한 순서를 지키고, 모든 사진의 썸네일을 찾을 때까지만 폴더를 넘겨 본다', async () => {
    vi.mocked(getSimilarStoryPhotos).mockResolvedValue({
      sourceTripAttachmentId: 42,
      items: [
        { tripAttachmentId: 51, similarityScore: 0.9 },
        { tripAttachmentId: 44, similarityScore: 0.8 },
      ],
    });
    vi.mocked(getPlacePhotos)
      .mockResolvedValueOnce(page([42, 44], 'next'))
      .mockResolvedValueOnce(page([51], 'more'));

    await expect(findSimilarStoryPhotos(params)).resolves.toEqual([
      { tripAttachmentId: 51, thumbnailUrl: 'https://cdn.test/51' },
      { tripAttachmentId: 44, thumbnailUrl: 'https://cdn.test/44' },
    ]);
    expect(getSimilarStoryPhotos).toHaveBeenCalledWith(9, 99);
    expect(getPlacePhotos).toHaveBeenNthCalledWith(1, 7, 3, null);
    expect(getPlacePhotos).toHaveBeenNthCalledWith(2, 7, 3, 'next');
    expect(getPlacePhotos).toHaveBeenCalledTimes(2);
  });

  it('비슷한 사진이 없으면 폴더를 조회하지 않는다', async () => {
    vi.mocked(getSimilarStoryPhotos).mockResolvedValue({ sourceTripAttachmentId: 42, items: [] });

    await expect(findSimilarStoryPhotos(params)).resolves.toEqual([]);
    expect(getPlacePhotos).not.toHaveBeenCalled();
  });
});
