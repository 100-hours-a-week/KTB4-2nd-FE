import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import { unclassifiedPhotosQueries } from '@/queryFactory';

import type { UnclassifiedPhotoPageResult } from '../api/getUnclassifiedPhotos';

export function removeCachedUnclassifiedPhotos(
  client: QueryClient,
  photoIds: number[],
  tripId?: number,
) {
  const removed = new Set(photoIds);
  client.setQueriesData<InfiniteData<UnclassifiedPhotoPageResult>>(
    {
      queryKey:
        tripId === undefined
          ? unclassifiedPhotosQueries.allKeys()
          : unclassifiedPhotosQueries.tripKeys(tripId),
      predicate: (query) => query.queryKey[2] === 'photos',
    },
    (data) => {
      if (!data) return data;
      const removedCount = new Set(
        data.pages
          .flatMap((page) => page.photos)
          .filter((photo) => removed.has(photo.id))
          .map((photo) => photo.id),
      ).size;
      if (!removedCount) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          photos: page.photos.filter((photo) => !removed.has(photo.id)),
          totalCount: Math.max(0, page.totalCount - removedCount),
        })),
      };
    },
  );
}
