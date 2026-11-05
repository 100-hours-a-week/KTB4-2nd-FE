import { getPlacePhotos } from '@/features/photoList';

import { getSimilarStoryPhotos } from '../api/getSimilarStoryPhotos';

export type SimilarStoryPhoto = { tripAttachmentId: number; thumbnailUrl: string | null };

const MAX_FOLDER_PAGES = 10;

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
