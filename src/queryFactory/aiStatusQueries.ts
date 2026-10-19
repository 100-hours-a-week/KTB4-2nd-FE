import { queryOptions } from '@tanstack/react-query';

import { getAiStatus } from '@/features/aiStatus/api/getAiStatus';

const AI_STATUS_STALE_MS = 10_000;

export const aiStatusQueries = {
  allKeys: () => ['aiStatus'] as const,
  status: () =>
    queryOptions({
      queryKey: aiStatusQueries.allKeys(),
      queryFn: getAiStatus,
      staleTime: AI_STATUS_STALE_MS,
      retry: false,
    }),
};
