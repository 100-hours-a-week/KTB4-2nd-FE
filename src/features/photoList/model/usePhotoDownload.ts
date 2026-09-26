'use client';

import { useMutation } from '@tanstack/react-query';

import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { triggerDownload } from '../lib/triggerDownload';
import { issueBulkPhotoDownloadUrl, issuePhotoDownloadUrl } from '../api/photoDownload';
import { BULK_DOWNLOAD_LIMIT } from './types';

export function usePhotoDownload() {
  return useMutation({
    mutationFn: async (photoIds: number[]) => {
      if (photoIds.length === 1) {
        const { downloadUrl } = await issuePhotoDownloadUrl(photoIds[0]);
        return { downloadUrl, fileName: undefined };
      }

      const csrfToken = await fetchCsrfToken();
      return issueBulkPhotoDownloadUrl(photoIds, csrfToken);
    },
    onMutate: (photoIds: number[]) => {
      if (photoIds.length > BULK_DOWNLOAD_LIMIT) {
        toast.warning(`한 번에 ${BULK_DOWNLOAD_LIMIT}장까지 받을 수 있어요.`);
      }
    },
    onSuccess: ({ downloadUrl, fileName }) => {
      triggerDownload(downloadUrl, fileName);
      toast.success('사진을 다운했어요.');
    },
    onError: () => {
      toast.error('사진을 다운로드하지 못했어요.');
    },
  });
}
