import { queryOptions } from '@tanstack/react-query';

import { getTripMap } from '@/features/mainMap/api/getTripMap';
import { toTripMapMarkers } from '@/features/mainMap/model/tripMapMarker';

export const mainMapQueries = {
  markers: () =>
    queryOptions({
      queryKey: ['mainMap', 'markers'] as const,
      queryFn: getTripMap,
      select: toTripMapMarkers,
      retry: false,
    }),
};
