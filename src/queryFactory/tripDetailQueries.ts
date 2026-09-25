import { infiniteQueryOptions } from '@tanstack/react-query';

import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';

export const tripDetailQueries = {
  allKeys: () => ['tripDetail'] as const,
  placeFolderKeys: (tripId: number) =>
    [...tripDetailQueries.allKeys(), 'placeFolders', tripId] as const,
  placeFolders: (tripId: number) =>
    infiniteQueryOptions({
      queryKey: tripDetailQueries.placeFolderKeys(tripId),
      queryFn: ({ pageParam }) => getTripPlaceFolders(tripId, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }),
};
