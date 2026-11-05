import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { StoryTonePreviewResponse, StoryTonePreviewRequest } from '../model/storyEdit';

/** 바꾼 분위기로 글을 다시 써서 보여주기만 하고, 저장은 수정 API로 합니다. */
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
