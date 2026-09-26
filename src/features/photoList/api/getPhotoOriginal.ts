import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

export type PhotoOriginal = {
  tripAttachmentId: number;
  originalUrl: string;
};

export async function getPhotoOriginal(photoId: number): Promise<PhotoOriginal> {
  const { data } = await apiClient.get<ApiResponse<PhotoOriginal>>(`/attachments/${photoId}`);

  return data.data;
}
