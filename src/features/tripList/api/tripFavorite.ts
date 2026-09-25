import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

export type TripFavoriteResponse = {
  tripId: number;
  isFavorite: boolean;
};

export async function registerTripFavorite(
  tripId: number,
  csrfToken: string,
): Promise<TripFavoriteResponse> {
  const { data } = await apiClient.post<ApiResponse<TripFavoriteResponse>>(
    `/trips/${tripId}/favorite`,
    null,
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );

  return data.data;
}

export async function removeTripFavorite(tripId: number, csrfToken: string): Promise<void> {
  await apiClient.delete(`/trips/${tripId}/favorite`, {
    headers: { 'X-CSRF-TOKEN': csrfToken },
  });
}
