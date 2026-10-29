import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { ShareUser } from '../model/types';

export async function searchShareUser(email: string): Promise<ShareUser> {
  const { data } = await apiClient.get<ApiResponse<ShareUser>>('/users/search', {
    params: { email },
  });

  return data.data;
}
