'use client';

import { useQuery } from '@tanstack/react-query';

import { photoListQueries } from '@/queryFactory';

/** 원본 보기를 열었을 때만 원본 URL을 발급받습니다. */
export function usePhotoOriginal(photoId: number | null) {
  const { data } = useQuery({
    ...photoListQueries.original(photoId ?? 0),
    enabled: photoId !== null,
  });

  return data?.originalUrl ?? null;
}
