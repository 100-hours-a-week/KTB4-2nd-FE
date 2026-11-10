import { infiniteQueryOptions } from '@tanstack/react-query';

import { getFavoriteTrips } from '@/features/tripList/api/getFavoriteTrips';
import { getInvitedTrips } from '@/features/tripList/api/getInvitedTrips';
import { getTrips } from '@/features/tripList/api/getTrips';
import type { TripListFilter } from '@/features/tripList/model/types';
import { realtimePollingInterval } from '@/shared/api/realtime';

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
          ? realtimePollingInterval(PROCESSING_POLLING_MS)
          : false,
    }),
  favoriteKeys: () => [...tripListQueries.allKeys(), 'favorites'] as const,
  favorites: () =>
    infiniteQueryOptions({
      queryKey: tripListQueries.favoriteKeys(),
      queryFn: ({ pageParam }) => getFavoriteTrips(pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    }),
  invitedKeys: () => [...tripListQueries.allKeys(), 'invited'] as const,
  invited: () =>
    infiniteQueryOptions({
      queryKey: tripListQueries.invitedKeys(),
      queryFn: ({ pageParam }) => getInvitedTrips(pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
    }),
};
