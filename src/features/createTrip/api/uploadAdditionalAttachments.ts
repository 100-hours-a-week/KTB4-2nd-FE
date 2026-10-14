import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

import { getContentType, putToStorage, type UploadTarget } from './uploadInitialAttachments';

export type AdditionalUploadBatchParams = {
  tripId: number;
  /** 한 번의 사진 추가를 묶는 UUID입니다. 같은 추가의 모든 Batch와 재시도에 같은 값을 씁니다. */
  additionId: string;
  files: File[];
  batchNo: number;
  totalAttachmentCount: number;
  complete: boolean;
  csrfToken: string;
  onUploadProgress?: (ratio: number) => void;
  signal?: AbortSignal;
};

type AdditionalAttachmentUploadUrls = {
  uploadId: string;
  attachments: UploadTarget[];
};

/** 이미 만든 여행에 사진을 추가합니다. 여행 생성처럼 Batch마다 URL 발급 → S3 업로드 → 완료 순으로 보냅니다. */
export async function uploadAdditionalAttachmentBatch({
  tripId,
  additionId,
  files,
  batchNo,
  totalAttachmentCount,
  complete,
  csrfToken,
  onUploadProgress,
  signal,
}: AdditionalUploadBatchParams): Promise<void> {
  const headers = { 'X-CSRF-TOKEN': csrfToken };

  const { data: issued } = await apiClient.post<ApiResponse<AdditionalAttachmentUploadUrls>>(
    `/trips/${tripId}/attachments/upload-urls`,
    {
      additionId,
      batchNo,
      totalAttachmentCount,
      complete,
      attachments: files.map((file) => ({
        fileName: file.name,
        contentType: getContentType(file),
        sizeBytes: file.size,
      })),
    },
    { headers, signal },
  );
  const { uploadId, attachments } = issued.data;
  if (attachments.length !== files.length) {
    throw new Error('업로드 URL 수가 파일 수와 다릅니다.');
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const loadedBytes = files.map(() => 0);
  await Promise.all(
    files.map((file, index) =>
      putToStorage(
        file,
        attachments[index],
        (loaded) => {
          loadedBytes[index] = Math.min(loaded, file.size);
          if (totalBytes > 0) {
            onUploadProgress?.(loadedBytes.reduce((sum, bytes) => sum + bytes, 0) / totalBytes);
          }
        },
        signal,
      ),
    ),
  );

  await apiClient.post(
    `/trips/${tripId}/attachments`,
    { uploadId },
    { headers, timeout: 0, signal },
  );
}
