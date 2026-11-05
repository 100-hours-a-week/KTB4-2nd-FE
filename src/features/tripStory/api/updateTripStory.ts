import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { StoryUpdateResponse, StoryUpdateRequest } from '../model/storyEdit';

export async function updateTripStory(
  storyId: number,
  request: StoryUpdateRequest,
  csrfToken: string,
): Promise<StoryUpdateResponse> {
  const { data } = await apiClient.put<ApiResponse<StoryUpdateResponse>>(
    `/stories/${storyId}`,
    request,
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );

  return data.data;
}
