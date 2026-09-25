import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripProcessingStatus } from './getTripProcessingStatus';

export type UploadInitialAttachmentsResponse = {
  tripId: number;
  status: TripProcessingStatus;
  totalAttachments: number;
};

export async function uploadInitialAttachments(
  tripId: number,
  files: File[],
  csrfToken: string,
  onUploadProgress?: (ratio: number) => void,
): Promise<UploadInitialAttachmentsResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('attachments[]', file));

  const { data } = await apiClient.post<ApiResponse<UploadInitialAttachmentsResponse>>(
    `/trips/${tripId}/initial-attachments`,
    formData,
    {
      headers: { 'X-CSRF-TOKEN': csrfToken },
      timeout: 0,
      onUploadProgress: ({ progress }) => {
        if (progress !== undefined) onUploadProgress?.(progress);
      },
    },
  );

  return data.data;
}
