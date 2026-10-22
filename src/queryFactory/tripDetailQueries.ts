import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { fetchTripSummary } from '@/features/tripDetail/api/fetchTripSummary';
import { getTripPlaceFolders } from '@/features/tripDetail/api/getTripPlaceFolders';

export const tripDetailQueries = {
  allKeys: () => ['tripDetail'] as const,
  summaryKeys: (tripId: number) => [...tripDetailQueries.allKeys(), 'summary', tripId] as const,
  summary: (tripId: number) =>
    queryOptions({
      queryKey: tripDetailQueries.summaryKeys(tripId),
      queryFn: () => fetchTripSummary(tripId),
      retry: false,
    }),
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
