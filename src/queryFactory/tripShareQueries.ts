import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { getMyTripPermission } from '@/features/tripShare/api/getMyTripPermission';
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
  myPermissionKeys: (tripId: number) =>
    [...tripShareQueries.allKeys(), 'myPermission', tripId] as const,
  myPermission: (tripId: number) =>
    queryOptions({
      queryKey: tripShareQueries.myPermissionKeys(tripId),
      queryFn: () => getMyTripPermission(tripId),
      staleTime: 60_000,
    }),
};
