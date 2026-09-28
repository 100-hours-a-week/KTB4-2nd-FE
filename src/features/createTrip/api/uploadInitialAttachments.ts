import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripProcessingStatusResponse } from './getTripProcessingStatus';

export async function uploadInitialAttachments(
  tripId: number,
  files: File[],
  csrfToken: string,
  onUploadProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<TripProcessingStatusResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('attachments[]', file));

  const { data } = await apiClient.post<ApiResponse<TripProcessingStatusResponse>>(
    `/trips/${tripId}/initial-attachments`,
    formData,
    {
      headers: { 'X-CSRF-TOKEN': csrfToken },
      timeout: 0,
      signal,
      onUploadProgress: ({ progress }) => {
        if (progress !== undefined) onUploadProgress?.(progress);
      },
    },
  );

  return data.data;
}
