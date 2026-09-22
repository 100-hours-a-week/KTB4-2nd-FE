import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripMapMarker } from '../model/tripMapMarker';

type TripMapResponse = { markers: TripMapMarker[] };

export async function getTripMap(): Promise<TripMapMarker[]> {
  const { data } = await apiClient.get<ApiResponse<TripMapResponse>>('/trips/map');

  return data.data.markers;
}
