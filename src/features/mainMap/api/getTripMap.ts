import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripMapApiMarker } from '../model/tripMapMarker';

type TripMapResponse = { markers: TripMapApiMarker[] };

export async function getTripMap(): Promise<TripMapApiMarker[]> {
  const { data } = await apiClient.get<ApiResponse<TripMapResponse>>('/trips/map');

  return data.data.markers;
}
