import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import type { TripProcessingStatusResponse } from './getTripProcessingStatus';

export const UPLOAD_BATCH_SIZE = 10;

export type UploadBatchParams = {
  tripId: number;
  files: File[];
  batchNo: number;
  totalAttachmentCount: number;
  complete: boolean;
  csrfToken: string;
  onUploadProgress?: (ratio: number) => void;
  signal?: AbortSignal;
};

export async function uploadInitialAttachmentBatch({
  tripId,
  files,
  batchNo,
  totalAttachmentCount,
  complete,
  csrfToken,
  onUploadProgress,
  signal,
}: UploadBatchParams): Promise<TripProcessingStatusResponse | null> {
  const formData = new FormData();
  files.forEach((file) => formData.append('attachments[]', file));
  formData.append('batchNo', String(batchNo));
  formData.append('totalAttachmentCount', String(totalAttachmentCount));
  formData.append('complete', String(complete));

  const { data } = await apiClient.post<ApiResponse<TripProcessingStatusResponse> | ''>(
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

  return data ? data.data : null;
}

export function splitIntoUploadBatches(files: File[]): File[][] {
  const batches: File[][] = [];

  for (let index = 0; index < files.length; index += UPLOAD_BATCH_SIZE) {
    batches.push(files.slice(index, index + UPLOAD_BATCH_SIZE));
  }

  return batches;
}
