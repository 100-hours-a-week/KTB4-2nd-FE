'use client';

import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import type { TripDetail } from '@/features/tripDetail';
import { toTripStory, type TripStory } from '@/features/tripStory';
import { tripStoryQueries } from '@/queryFactory';

import { TripStoryPage } from './tripStoryPage';

export function TripStoryDetailPage({ trip }: { trip: TripDetail }) {
  const query = useQuery({
    ...tripStoryQueries.detail(trip.id),
    retry: (failureCount, error) => {
      if (isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 401))
        return false;
      return failureCount < 1;
    },
  });
  const notFound = isAxiosError(query.error) && query.error.response?.status === 404;
  const story: TripStory = query.data
    ? toTripStory(trip, query.data)
    : {
        tripId: trip.id,
        tripName: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        photoCount: trip.photoCount,
        days: [],
      };
  return (
    <TripStoryPage
      story={story}
      isLoading={query.isPending}
      errorMessage={
        query.isError && !notFound
          ? '스토리를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
          : undefined
      }
      onRetry={() => void query.refetch()}
    />
  );
}
