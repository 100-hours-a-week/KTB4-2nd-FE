import axios from 'axios';
import { beforeEach, expect, it, vi } from 'vitest';

import { apiClient } from '@/shared/api/browser';

import { uploadAdditionalAttachmentBatch } from './uploadAdditionalAttachments';

vi.mock('@/shared/api/browser', () => ({ apiClient: { post: vi.fn() } }));
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, request: vi.fn() } };
});

const jpg = new File(['1234'], 'photo-01.jpg', { type: 'image/jpeg' });
const additionId = '5b1d2a3c-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(axios.request).mockResolvedValue({});
  vi.mocked(apiClient.post)
    .mockResolvedValueOnce({
      data: {
        data: {
          uploadId: 'addition-upload-1',
          attachments: [
            {
              fileName: 'photo-01.jpg',
              uploadUrl: 'https://s3.test/photo-01.jpg?signature',
              method: 'PUT',
              headers: { 'Content-Type': 'image/jpeg', 'If-None-Match': '*' },
              expiresAt: '2026-10-14T12:10:00Z',
            },
          ],
        },
      },
    })
    .mockResolvedValueOnce({
      data: { data: { tripId: 7, status: 'QUEUED', totalAttachments: 1 } },
    });
});

it('추가 사진 URL을 같은 additionId로 발급받아 S3에 올리고 Batch 완료를 알린다', async () => {
  await uploadAdditionalAttachmentBatch({
    tripId: 7,
    additionId,
    files: [jpg],
    batchNo: 1,
    totalAttachmentCount: 1,
    complete: true,
    csrfToken: 'csrf-token',
  });

  expect(apiClient.post).toHaveBeenNthCalledWith(
    1,
    '/trips/7/attachments/upload-urls',
    {
      additionId,
      batchNo: 1,
      totalAttachmentCount: 1,
      complete: true,
      attachments: [{ fileName: 'photo-01.jpg', contentType: 'image/jpeg', sizeBytes: 4 }],
    },
    expect.objectContaining({ headers: { 'X-CSRF-TOKEN': 'csrf-token' } }),
  );
  expect(axios.request).toHaveBeenCalledWith(
    expect.objectContaining({ url: 'https://s3.test/photo-01.jpg?signature', method: 'PUT' }),
  );
  expect(apiClient.post).toHaveBeenNthCalledWith(
    2,
    '/trips/7/attachments',
    { uploadId: 'addition-upload-1' },
    expect.objectContaining({ headers: { 'X-CSRF-TOKEN': 'csrf-token' } }),
  );
});
