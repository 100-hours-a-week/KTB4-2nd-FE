import { infiniteQueryOptions } from '@tanstack/react-query';

import { getTrips } from '@/features/tripList/api/getTrips';
import type { TripListFilter } from '@/features/tripList/model/types';

const PROCESSING_POLLING_MS = 5_000;

export const tripListQueries = {
  allKeys: () => ['tripList'] as const,
  listKeys: (filter: TripListFilter) => [...tripListQueries.allKeys(), 'list', filter] as const,
  list: (filter: TripListFilter) =>
    infiniteQueryOptions({
      queryKey: tripListQueries.listKeys(filter),
      queryFn: ({ pageParam }) => getTrips({ ...filter, cursor: pageParam }),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchInterval: (query) =>
        query.state.data?.pages.some((page) =>
          page.trips.some((trip) => trip.processingStatus !== 'ready'),
        )
          ? PROCESSING_POLLING_MS
          : false,
    }),
};
