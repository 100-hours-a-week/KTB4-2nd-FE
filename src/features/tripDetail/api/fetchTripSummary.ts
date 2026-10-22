import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripDetail } from '../model/types';
import { toTripDetail, type TripDetailApiResponse } from './tripDetailResponse';

export async function fetchTripSummary(tripId: number): Promise<TripDetail> {
  const { data } = await apiClient.get<ApiResponse<TripDetailApiResponse>>(`/trips/${tripId}`);
  return toTripDetail(data.data);
}
