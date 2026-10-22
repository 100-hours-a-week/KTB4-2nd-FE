import axios from 'axios';

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

export type UploadTarget = {
  fileName: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
};

type InitialAttachmentUploadUrls = {
  uploadId: string;
  attachments: UploadTarget[];
};

const CONTENT_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
};

const HEIC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1']);

function detectContentType(header: Uint8Array) {
  if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'image/jpeg';
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
    return 'image/png';
  }
  const box = String.fromCharCode(...header.slice(4, 8));
  const brand = String.fromCharCode(...header.slice(8, 12));
  if (box === 'ftyp' && HEIC_BRANDS.has(brand)) return 'image/heic';
  return null;
}

export async function getContentType(file: File) {
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const detected = detectContentType(header);
    if (detected) return detected;
  } catch {}
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES_BY_EXTENSION[extension] ?? file.type;
}

export async function putToStorage(
  file: File,
  target: UploadTarget,
  onProgress: (loaded: number) => void,
  signal?: AbortSignal,
) {
  try {
    await axios.request({
      url: target.uploadUrl,
      method: target.method,
      data: file,
      headers: target.headers,
      timeout: 0,
      signal,
      onUploadProgress: ({ loaded }) => onProgress(loaded),
    });
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 412) throw error;
  }
  onProgress(file.size);
}

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
  const headers = { 'X-CSRF-TOKEN': csrfToken };

  const { data: issued } = await apiClient.post<ApiResponse<InitialAttachmentUploadUrls>>(
    `/trips/${tripId}/initial-attachments/upload-urls`,
    {
      batchNo,
      totalAttachmentCount,
      complete,
      attachments: await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          contentType: await getContentType(file),
          sizeBytes: file.size,
        })),
      ),
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

  const { data } = await apiClient.post<ApiResponse<TripProcessingStatusResponse> | ''>(
    `/trips/${tripId}/initial-attachments`,
    { uploadId },
    { headers, timeout: 0, signal },
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
