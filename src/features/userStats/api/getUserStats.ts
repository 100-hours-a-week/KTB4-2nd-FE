import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { UserStats } from '../model/types';

type UserStatsResponse = {
  tripCount: number;
  attachmentCount: number;
  storyCount: number;
  storageUsedBytes: number;
  storageMaximumBytes: number;
};

export async function getUserStats(): Promise<UserStats> {
  const { data } = await apiClient.get<ApiResponse<UserStatsResponse>>('/users/me/stats');

  return {
    tripCount: data.data.tripCount,
    photoCount: data.data.attachmentCount,
    storyCount: data.data.storyCount,
    storageUsedBytes: data.data.storageUsedBytes,
    storageLimitBytes: data.data.storageMaximumBytes,
  };
}
