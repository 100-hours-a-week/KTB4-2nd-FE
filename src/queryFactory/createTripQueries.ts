import { queryOptions } from '@tanstack/react-query';

import { getTripForEdit } from '@/features/createTrip/api/getTripForEdit';
import { getTripProcessingStatus } from '@/features/createTrip/api/getTripProcessingStatus';
import { searchPlaces } from '@/features/createTrip/api/searchPlaces';

const PROCESSING_STATUS_POLLING_MS = 2_000;

export const createTripQueries = {
  allKeys: () => ['createTrip'] as const,
  placeSearchKeys: (query: string) =>
    [...createTripQueries.allKeys(), 'placeSearch', query] as const,
  placeSearch: (query: string) =>
    queryOptions({
      queryKey: createTripQueries.placeSearchKeys(query),
      queryFn: () => searchPlaces(query),
      staleTime: 5 * 60_000,
    }),
  processingStatusKeys: (tripId: number) =>
    [...createTripQueries.allKeys(), 'processingStatus', tripId] as const,
  processingStatus: (tripId: number) =>
    queryOptions({
      queryKey: createTripQueries.processingStatusKeys(tripId),
      queryFn: () => getTripProcessingStatus(tripId),
      refetchInterval: (query) =>
        !query.state.data || query.state.data.status === 'PROCESSING'
          ? PROCESSING_STATUS_POLLING_MS
          : false,
      retry: false,
    }),
  editKeys: (tripId: number) => [...createTripQueries.allKeys(), 'edit', tripId] as const,
  edit: (tripId: number) =>
    queryOptions({
      queryKey: createTripQueries.editKeys(tripId),
      queryFn: () => getTripForEdit(tripId),
      staleTime: 0,
      gcTime: 0,
    }),
};
