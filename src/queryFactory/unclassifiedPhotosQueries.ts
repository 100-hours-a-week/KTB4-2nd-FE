import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getUnclassifiedFolders } from '@/features/unclassifiedPhotos/api/getUnclassifiedFolders';
import { getUnclassifiedPhotos } from '@/features/unclassifiedPhotos/api/getUnclassifiedPhotos';
import type { UnclassifiedIssue } from '@/features/unclassifiedPhotos/model/types';

export const unclassifiedPhotosQueries = {
  allKeys: () => ['unclassifiedPhotos'] as const,
  tripKeys: (tripId: number) => [...unclassifiedPhotosQueries.allKeys(), tripId] as const,
  folderKeys: (tripId: number) =>
    [...unclassifiedPhotosQueries.tripKeys(tripId), 'folders'] as const,
  folders: (tripId: number) =>
    queryOptions({
      queryKey: unclassifiedPhotosQueries.folderKeys(tripId),
      queryFn: () => getUnclassifiedFolders(tripId),
    }),
  photoKeys: (tripId: number, issue: UnclassifiedIssue) =>
    [...unclassifiedPhotosQueries.tripKeys(tripId), 'photos', issue] as const,
  photos: (tripId: number, issue: UnclassifiedIssue) =>
    infiniteQueryOptions({
      queryKey: unclassifiedPhotosQueries.photoKeys(tripId, issue),
      queryFn: ({ pageParam }) => getUnclassifiedPhotos(tripId, issue, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
};
