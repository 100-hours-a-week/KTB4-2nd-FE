import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripAccessPermission } from '../model/types';

type TripEditPermissionResponse = {
  permission?: string | null;
};

const PERMISSIONS = new Set<string>(['OWNER', 'WRITE', 'READ']);

export async function getMyTripPermission(tripId: number): Promise<TripAccessPermission | null> {
  const { data } = await apiClient.get<ApiResponse<TripEditPermissionResponse>>(
    `/trips/${tripId}/edit`,
  );
  const { permission } = data.data;
  return typeof permission === 'string' && PERMISSIONS.has(permission)
    ? (permission as TripAccessPermission)
    : null;
}
