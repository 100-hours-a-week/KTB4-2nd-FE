import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripSharePermission } from '../model/types';

type TripShareCreateResponse = {
  tripShareId: number;
  granteeUserId: number;
  permission: TripSharePermission;
  expiresAt: string;
};

export async function createTripShare(
  tripId: number,
  request: { granteeUserId: number; permission: TripSharePermission },
  csrfToken: string,
): Promise<TripShareCreateResponse> {
  const { data } = await apiClient.post<ApiResponse<TripShareCreateResponse>>(
    `/trips/${tripId}/shares`,
    request,
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );

  return data.data;
}
