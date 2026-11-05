import { getPlacePhotos } from '@/features/photoList';

import { getSimilarStoryPhotos } from '../api/getSimilarStoryPhotos';

export type SimilarStoryPhoto = { tripAttachmentId: number; thumbnailUrl: string | null };

const MAX_FOLDER_PAGES = 10;

/**
 * 유사 사진 API는 사진 번호만 주므로, 같은 장소 폴더 사진 목록에서 썸네일을 찾아 붙입니다.
 * TODO: 백엔드 응답에 thumbnailUrl이 들어오면 폴더 조회를 없앱니다.
 */
export async function findSimilarStoryPhotos({
  tripId,
  tripPlaceId,
  storyId,
  storyBlockId,
}: {
  tripId: number;
  tripPlaceId: number;
  storyId: number;
  storyBlockId: number;
}): Promise<SimilarStoryPhoto[]> {
  const { items } = await getSimilarStoryPhotos(storyId, storyBlockId);
  if (items.length === 0) return [];

  const thumbnails = new Map<number, string | null>();
  let cursor: string | null = null;
  for (let page = 0; page < MAX_FOLDER_PAGES; page += 1) {
    const result = await getPlacePhotos(tripId, tripPlaceId, cursor);
    result.photos.forEach((photo) => thumbnails.set(photo.id, photo.thumbnailUrl ?? null));
    if (items.every((item) => thumbnails.has(item.tripAttachmentId)) || !result.hasNext) break;
    cursor = result.nextCursor;
  }

  return items.map(({ tripAttachmentId }) => ({
    tripAttachmentId,
    thumbnailUrl: thumbnails.get(tripAttachmentId) ?? null,
  }));
}
