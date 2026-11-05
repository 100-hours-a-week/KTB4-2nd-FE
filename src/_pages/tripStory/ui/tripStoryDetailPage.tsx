'use client';

import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import type { TripDetail } from '@/features/tripDetail';
import { toTripStory, type TripStory } from '@/features/tripStory';
import { tripStoryQueries } from '@/queryFactory';

import { TripStoryEditor } from './tripStoryEditor';
import { TripStoryPage } from './tripStoryPage';

export function TripStoryDetailPage({ trip }: { trip: TripDetail }) {
  const [editing, setEditing] = useState(false);
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
  const canEdit = !!query.data?.userByMe && story.days.length > 0;

  if (editing && query.data) {
    return (
      <TripStoryEditor
        trip={story}
        story={query.data}
        onClose={() => {
          setEditing(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <TripStoryPage
      story={story}
      isLoading={query.isPending}
      isRetrying={query.isFetching}
      errorMessage={
        query.isError && !notFound
          ? '스토리를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
          : undefined
      }
      onRetry={() => void query.refetch()}
      onEdit={canEdit ? () => setEditing(true) : undefined}
    />
  );
}
