import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripProcessingStatus } from './getTripProcessingStatus';

export type CreateTripRequest = {
  tripName: string;
  startDate: string;
  endDate: string;
  regionCodes: string[];
};

export type CreateTripResponse = {
  tripId: number;
  status: TripProcessingStatus;
};

export async function createTrip(
  request: CreateTripRequest,
  csrfToken: string,
): Promise<CreateTripResponse> {
  const { data } = await apiClient.post<ApiResponse<CreateTripResponse>>('/trips', request, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });

  return data.data;
}
