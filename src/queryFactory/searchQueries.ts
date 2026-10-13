import { queryOptions } from '@tanstack/react-query';

import { searchTrips } from '@/features/search/api/searchTrips';

export const searchQueries = {
  allKeys: () => ['search'] as const,
  resultKeys: (query: string) => [...searchQueries.allKeys(), 'result', query] as const,
  result: (query: string) =>
    queryOptions({
      queryKey: searchQueries.resultKeys(query),
      queryFn: () => searchTrips(query),
      staleTime: 5 * 60_000,
      retry: false,
    }),
};
