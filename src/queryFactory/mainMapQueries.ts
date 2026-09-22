import { queryOptions } from '@tanstack/react-query';

import { getTripMap } from '@/features/mainMap/api/getTripMap';

export const mainMapQueries = {
  markers: () =>
    queryOptions({
      queryKey: ['mainMap', 'markers'] as const,
      queryFn: getTripMap,
      retry: false,
    }),
};
