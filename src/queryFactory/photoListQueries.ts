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
      queryFn: ({ pageParam }) => getPlacePhotos(tripId, tripPlaceId, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
  originalKeys: (photoId: number) => [...photoListQueries.allKeys(), 'original', photoId] as const,
  original: (photoId: number) =>
    queryOptions({
      queryKey: photoListQueries.originalKeys(photoId),
      queryFn: () => getPhotoOriginal(photoId),
      // 발급된 원본 URL은 만료되므로 오래 재사용하지 않습니다.
      staleTime: 5 * 60_000,
    }),
};
