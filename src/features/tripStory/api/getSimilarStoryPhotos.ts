import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

export type SimilarStoryPhotoListResponse = {
  sourceTripAttachmentId: number;
  /** 같은 장소 폴더에서 스토리에 아직 쓰이지 않은 사진만, 비슷한 순서대로 최대 10장 옵니다. */
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
