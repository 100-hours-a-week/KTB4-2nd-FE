import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { getStoryGenerationStatus } from '@/features/createStory/api/getStoryGenerationStatus';
import { getStorySourceFolders } from '@/features/createStory/api/getStorySourceFolders';
import { isStoryGenerationRunning } from '@/features/createStory/model/types';

const GENERATION_STATUS_POLLING_MS = 2_000;

export const storyCreateQueries = {
  allKeys: () => ['storyCreate'] as const,
  sourceFolderKeys: (tripId: number) =>
    [...storyCreateQueries.allKeys(), 'sourceFolders', tripId] as const,
  sourceFolders: (tripId: number) =>
    infiniteQueryOptions({
      queryKey: storyCreateQueries.sourceFolderKeys(tripId),
      queryFn: ({ pageParam }) => getStorySourceFolders(tripId, pageParam),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      retry: (failureCount, error) =>
        !(isAxiosError(error) && error.response?.status === 409) && failureCount < 3,
    }),
  generationStatusKeys: (generationId: number) =>
    [...storyCreateQueries.allKeys(), 'generationStatus', generationId] as const,
  generationStatus: (generationId: number) =>
    queryOptions({
      queryKey: storyCreateQueries.generationStatusKeys(generationId),
      queryFn: () => getStoryGenerationStatus(generationId),
      refetchInterval: (query) => {
        if (isAxiosError(query.state.error) && query.state.error.response?.status === 404)
          return false;
        return !query.state.data || isStoryGenerationRunning(query.state.data.status)
          ? GENERATION_STATUS_POLLING_MS
          : false;
      },
    }),
};
