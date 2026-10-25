import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getPhotoOriginal } from '@/features/photoList/api/getPhotoOriginal';
import { getPlacePhotos } from '@/features/photoList/api/getPlacePhotos';

export const photoListQueries = {
  allKeys: () => ['photoList'] as const,
  placePhotoKeys: (tripId: number, tripPlaceId: number) =>
    [...photoListQueries.allKeys(), 'placePhotos', tripId, tripPlaceId] as const,
  placePhotos: (tripId: number, tripPlaceId: number) =>
    infiniteQueryOptions({
      queryKey: photoListQueries.placePhotoKeys(tripId, tripPlaceId),
      queryFn: ({ pageParam, signal }) => getPlacePhotos(tripId, tripPlaceId, pageParam, signal),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage, _pages, _lastParam, params) =>
        lastPage.hasNext && lastPage.nextCursor && !params.includes(lastPage.nextCursor)
          ? lastPage.nextCursor
          : undefined,
    }),
  originalKeys: (photoId: number) => [...photoListQueries.allKeys(), 'original', photoId] as const,
  original: (photoId: number) =>
    queryOptions({
      queryKey: photoListQueries.originalKeys(photoId),
      queryFn: () => getPhotoOriginal(photoId),
      staleTime: 5 * 60_000,
    }),
};
