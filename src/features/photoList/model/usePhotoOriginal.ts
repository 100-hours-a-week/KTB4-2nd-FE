'use client';

import { useQuery } from '@tanstack/react-query';

import { photoListQueries } from '@/queryFactory';

export function usePhotoOriginal(photoId: number | null) {
  const { data } = usePhotoOriginalQuery(photoId);

  return data?.originalUrl ?? null;
}

export function usePhotoOriginalQuery(photoId: number | null) {
  return useQuery({
    ...photoListQueries.original(photoId ?? 0),
    enabled: photoId !== null,
  });
}
