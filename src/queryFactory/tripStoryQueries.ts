import { queryOptions } from '@tanstack/react-query';

import { getTripStory } from '@/features/tripStory/api/getTripStory';

export const tripStoryQueries = {
  detail: (tripId: number) =>
    queryOptions({
      queryKey: ['tripStory', tripId] as const,
      queryFn: () => getTripStory(tripId),
      staleTime: 60_000,
    }),
};
