import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

export type SimilarStoryPhotoListResponse = {
  sourceTripAttachmentId: number;
  items: { tripAttachmentId: number; similarityScore: number }[];
};

export async function getSimilarStoryPhotos(
  storyId: number,
  storyBlockId: number,
): Promise<SimilarStoryPhotoListResponse> {
  const { data } = await apiClient.get<ApiResponse<SimilarStoryPhotoListResponse>>(
    `/stories/${storyId}/blocks/${storyBlockId}/similar-attachments`,
  );

  return data.data;
}
