'use client';

import { useQuery } from '@tanstack/react-query';

import { photoListQueries } from '@/queryFactory';

export function usePhotoOriginal(photoId: number | null) {
  const { data } = useQuery({
    ...photoListQueries.original(photoId ?? 0),
    enabled: photoId !== null,
  });

  return data?.originalUrl ?? null;
}
