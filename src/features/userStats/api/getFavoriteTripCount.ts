import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

type FavoriteTripListResponse = {
  totalCount: number;
};

export async function getFavoriteTripCount(): Promise<number> {
  const { data } = await apiClient.get<ApiResponse<FavoriteTripListResponse>>('/trips/favorites');

  return data.data.totalCount;
}
