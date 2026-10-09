import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripStoryResponse } from '../model/types';

export async function getTripStory(tripId: number): Promise<TripStoryResponse> {
  const { data } = await apiClient.get<ApiResponse<TripStoryResponse>>(`/trips/${tripId}/story`);
  return data.data;
}
