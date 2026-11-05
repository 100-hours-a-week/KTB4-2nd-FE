import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { StoryTonePreviewResponse, StoryTonePreviewRequest } from '../model/storyEdit';

export async function previewStoryTone(
  storyId: number,
  request: StoryTonePreviewRequest,
  csrfToken: string,
): Promise<StoryTonePreviewResponse> {
  const { data } = await apiClient.post<ApiResponse<StoryTonePreviewResponse>>(
    `/stories/${storyId}/tone-preview`,
    request,
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );

  return data.data;
}
