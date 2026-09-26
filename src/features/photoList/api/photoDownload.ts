import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

type PhotoDownloadResponse = {
  tripAttachmentId: number;
  downloadUrl: string;
};

type BulkPhotoDownloadResponse = {
  fileName: string;
  downloadUrl: string;
};

export async function issuePhotoDownloadUrl(photoId: number): Promise<PhotoDownloadResponse> {
  const { data } = await apiClient.get<ApiResponse<PhotoDownloadResponse>>(
    `/attachments/${photoId}/download`,
  );

  return data.data;
}

/** 여러 장을 한 번에 받을 때는 백엔드가 zip 파일 URL을 발급합니다. */
export async function issueBulkPhotoDownloadUrl(
  photoIds: number[],
  csrfToken: string,
): Promise<BulkPhotoDownloadResponse> {
  const { data } = await apiClient.post<ApiResponse<BulkPhotoDownloadResponse>>(
    '/attachments/bulk-download',
    { tripAttachmentIds: photoIds },
    { headers: { 'X-CSRF-TOKEN': csrfToken } },
  );

  return data.data;
}
