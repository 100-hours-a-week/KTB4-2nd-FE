'use client';

import { useQuery } from '@tanstack/react-query';

import { tripDetailQueries } from '@/queryFactory';

import type { TripDetail } from './types';

export function useTripSummary(initialTrip: TripDetail): TripDetail {
  const { data, isFetchedAfterMount } = useQuery({
    ...tripDetailQueries.summary(initialTrip.id),
    initialData: initialTrip,
  });

  return isFetchedAfterMount ? data : initialTrip;
}
