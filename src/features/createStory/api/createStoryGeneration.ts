import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { StoryGenerationStatus, StoryMood } from '../model/types';

export type CreateStoryGenerationRequest = {
  mood: StoryMood;
  tripPlaceIds: number[];
};

export type CreateStoryGenerationResponse = {
  generationId: number;
  tripId: number;
  status: StoryGenerationStatus;
};

export async function createStoryGeneration(
  tripId: number,
  request: CreateStoryGenerationRequest,
  csrfToken: string,
): Promise<CreateStoryGenerationResponse> {
  const { data } = await apiClient.post<ApiResponse<CreateStoryGenerationResponse>>(
    `/trips/${tripId}/story-generations`,
    request,
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );

  return data.data;
}
