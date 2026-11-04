import { infiniteQueryOptions } from '@tanstack/react-query';

import { getTripShares } from '@/features/tripShare/api/getTripShares';

export const tripShareQueries = {
  allKeys: () => ['tripShare'] as const,
  listKeys: (tripId: number) => [...tripShareQueries.allKeys(), 'list', tripId] as const,
  list: (tripId: number) =>
    infiniteQueryOptions({
      queryKey: tripShareQueries.listKeys(tripId),
      queryFn: ({ pageParam }) => getTripShares(tripId, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 0,
    }),
};
