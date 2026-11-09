import { queryOptions } from '@tanstack/react-query';

import { getTripStory } from '@/features/tripStory/api/getTripStory';
import { findSimilarStoryPhotos } from '@/features/tripStory/model/similarStoryPhotos';

export const tripStoryQueries = {
  detail: (tripId: number) =>
    queryOptions({
      queryKey: ['tripStory', tripId] as const,
      queryFn: () => getTripStory(tripId),
      staleTime: 60_000,
    }),
  similarPhotos: (params: {
    tripId: number;
    tripPlaceId: number;
    storyId: number;
    storyBlockId: number;
  }) =>
    queryOptions({
      queryKey: ['tripStory', params.tripId, 'similarPhotos', params.storyBlockId] as const,
      queryFn: () => findSimilarStoryPhotos(params),
      staleTime: 60_000,
      retry: false,
    }),
};
