import { queryOptions } from '@tanstack/react-query';

import { getUnclassifiedFolders } from '@/features/unclassifiedPhotos/api/getUnclassifiedFolders';

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
};
