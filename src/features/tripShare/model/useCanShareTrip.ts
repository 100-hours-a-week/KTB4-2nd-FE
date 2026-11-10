'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { tripShareQueries } from '@/queryFactory';

export function useCanShareTrip(tripId: number) {
  const { isSuccess, error } = useInfiniteQuery(tripShareQueries.list(tripId));

  if (isSuccess) return true;
  if (!error) return false;
  return !(isAxiosError(error) && error.response?.status === 404);
}
