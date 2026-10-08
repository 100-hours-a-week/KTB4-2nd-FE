import axios, { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { uploadInitialAttachmentBatch } from './uploadInitialAttachments';

vi.mock('@/shared/api/browser', () => ({ apiClient: { post: vi.fn() } }));
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, request: vi.fn() } };
});

const jpg = new File(['1234'], 'photo-01.jpg', { type: 'image/jpeg' });
const heic = new File(['123456'], 'photo-02.HEIC', { type: 'image/heif' });
const target = (fileName: string, contentType: string) => ({
  fileName,
  uploadUrl: `https://s3.test/${fileName}?signature`,
  method: 'PUT' as const,
  headers: { 'Content-Type': contentType, 'If-None-Match': '*' },
  expiresAt: '2026-10-01T12:10:00+09:00',
});
const completed = {
  tripId: 7,
  status: 'COMPLETED' as const,
  progress: { done: 2, total: 2 },
  currentStep: null,
  result: null,
  error: null,
};

function mockIssuedUrls() {
  vi.mocked(apiClient.post).mockResolvedValueOnce({
    data: {
      data: {
        uploadId: 'upload-batch-001',
        attachments: [target('photo-01.jpg', 'image/jpeg'), target('photo-02.HEIC', 'image/heic')],
      },
    },
  });
}

function upload(complete = true, onUploadProgress?: (ratio: number) => void) {
  return uploadInitialAttachmentBatch({
    tripId: 7,
    files: [jpg, heic],
    batchNo: 2,
    totalAttachmentCount: 12,
    complete,
    csrfToken: 'csrf-token',
    onUploadProgress,
  });
}

describe('uploadInitialAttachmentBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.request).mockResolvedValue({ status: 200 });
  });

  it('URL을 발급받아 S3에 직접 올린 뒤 uploadId로 완료를 알린다', async () => {
    mockIssuedUrls();
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { data: completed } });

    await expect(upload()).resolves.toEqual(completed);

    expect(apiClient.post).toHaveBeenNthCalledWith(
      1,
      '/trips/7/initial-attachments/upload-urls',
      {
        batchNo: 2,
        totalAttachmentCount: 12,
        complete: true,
        attachments: [
          { fileName: 'photo-01.jpg', contentType: 'image/jpeg', sizeBytes: 4 },
          { fileName: 'photo-02.HEIC', contentType: 'image/heic', sizeBytes: 6 },
        ],
      },
      expect.objectContaining({ headers: { 'X-CSRF-TOKEN': 'csrf-token' } }),
    );
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://s3.test/photo-01.jpg?signature',
        method: 'PUT',
        data: jpg,
        headers: { 'Content-Type': 'image/jpeg', 'If-None-Match': '*' },
      }),
    );
    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://s3.test/photo-02.HEIC?signature', data: heic }),
    );
    expect(apiClient.post).toHaveBeenNthCalledWith(
      2,
      '/trips/7/initial-attachments',
      { uploadId: 'upload-batch-001' },
      expect.objectContaining({ headers: { 'X-CSRF-TOKEN': 'csrf-token' } }),
    );
  });

  it('중간 배치의 204 응답은 null로 돌려준다', async () => {
    mockIssuedUrls();
    vi.mocked(apiClient.post).mockResolvedValueOnce({ status: 204, data: '' });

    await expect(upload(false)).resolves.toBeNull();
  });

  it('배치 전체 바이트 기준으로 진행률을 알린다', async () => {
    mockIssuedUrls();
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: '' });
    vi.mocked(axios.request).mockImplementation(async (config) => {
      config.onUploadProgress?.({ loaded: 2, bytes: 2, lengthComputable: true });
      return { status: 200 };
    });
    const onUploadProgress = vi.fn();

    await upload(false, onUploadProgress);

    expect(onUploadProgress).toHaveBeenCalledWith(0.2);
    expect(onUploadProgress).toHaveBeenLastCalledWith(1);
  });

  it('이미 올라간 객체의 412는 넘기고 완료 API의 검증을 따른다', async () => {
    mockIssuedUrls();
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { data: completed } });
    vi.mocked(axios.request).mockRejectedValueOnce(
      new AxiosError('exists', '412', undefined, undefined, {
        status: 412,
        statusText: 'Precondition Failed',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: '',
      }),
    );

    await expect(upload()).resolves.toEqual(completed);
    expect(apiClient.post).toHaveBeenCalledTimes(2);
  });

  it('S3 전송이 실패하면 완료를 알리지 않는다', async () => {
    mockIssuedUrls();
    vi.mocked(axios.request).mockRejectedValueOnce(new Error('network'));

    await expect(upload()).rejects.toThrow('network');
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });
});
