import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { StoryGenerationStatus } from '../model/types';

export type StoryGenerationStatusResponse = {
  generationId: number;
  status: StoryGenerationStatus;
  /** 0~100 사이의 진행률입니다. */
  progress: number;
  storyId: number | null;
  error: { code: string; message: string } | null;
};

export async function getStoryGenerationStatus(
  generationId: number,
): Promise<StoryGenerationStatusResponse> {
  // 상태 조회만 단수형 경로(`story-generation`)를 사용합니다.
  const { data } = await apiClient.get<ApiResponse<StoryGenerationStatusResponse>>(
    `/story-generation/${generationId}`,
  );

  return data.data;
}
