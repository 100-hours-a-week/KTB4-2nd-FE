'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { invalidateTripData } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { getAllUnclassifiedPhotos } from '../api/getUnclassifiedPhotos';
import {
  restoreAttachment,
  restoreAttachments,
  type RestoreAttachmentItem,
} from '../api/restoreUnclassifiedPhotos';
import { BULK_RESTORE_LIMIT, type UnclassifiedIssue, type UnclassifiedPhoto } from './types';

export type RestoreUnclassifiedTarget =
  { issue: UnclassifiedIssue } | { photos: UnclassifiedPhoto[] };

export type RestoreUnclassifiedInput = RestoreUnclassifiedTarget & {
  fallbackPlaceId?: number;
};

export class RestorePlaceRequiredError extends Error {
  constructor(readonly photoCount: number) {
    super('되돌릴 장소 폴더를 골라주세요.');
  }
}

function getErrorCode(error: unknown) {
  if (!isAxiosError<{ message?: unknown }>(error)) return undefined;
  const code = error.response?.data?.message;
  return typeof code === 'string' ? code : undefined;
}

function toRestoreItems(photos: UnclassifiedPhoto[], fallbackPlaceId?: number) {
  const missingPlaceCount = photos.filter((photo) => photo.restoreTripPlaceId === null).length;
  if (missingPlaceCount > 0 && fallbackPlaceId === undefined) {
    throw new RestorePlaceRequiredError(missingPlaceCount);
  }

  return photos.map<RestoreAttachmentItem>((photo) => ({
    tripAttachmentId: photo.id,
    tripPlaceId: photo.restoreTripPlaceId ?? (fallbackPlaceId as number),
  }));
}

async function restore(tripId: number, input: RestoreUnclassifiedInput) {
  const photos =
    'issue' in input ? await getAllUnclassifiedPhotos(tripId, input.issue) : input.photos;
  if (photos.length === 0) return;

  const items = toRestoreItems(photos, input.fallbackPlaceId);
  const csrfToken = await fetchCsrfToken();

  if (items.length === 1) {
    await restoreAttachment(items[0], csrfToken);
    return;
  }

  for (let index = 0; index < items.length; index += BULK_RESTORE_LIMIT) {
    await restoreAttachments(items.slice(index, index + BULK_RESTORE_LIMIT), csrfToken);
  }
}

export function useRestoreUnclassifiedPhotos(tripId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RestoreUnclassifiedInput) => restore(tripId, input),
    // 여러 묶음으로 나눠 복원하다 중간에 실패해도 앞 묶음은 이미 복원됐으므로, 성공·실패 모두 갱신합니다.
    onSettled: async (_data, error) => {
      if (error instanceof RestorePlaceRequiredError) return;
      await invalidateTripData(queryClient);
    },
    onSuccess: () => {
      toast.success('사진을 원래 폴더로 되돌렸어요.');
    },
    onError: (error) => {
      if (error instanceof RestorePlaceRequiredError) return;

      const code = getErrorCode(error);
      if (
        code === 'BULK_RESTORE_FAILED' ||
        code === 'ATTACHMENT_RESTORE_NOT_ALLOWED' ||
        code === 'ATTACHMENT_NOT_FOUND' ||
        code === 'RESTORE_PLACE_MISMATCH'
      ) {
        toast.error('이미 처리됐거나 되돌릴 수 없는 사진이 있어요. 목록을 다시 확인해주세요.');
        return;
      }
      if (code === 'PLACE_FOLDER_NOT_FOUND') {
        toast.error('되돌릴 장소 폴더를 찾지 못했어요. 다른 폴더를 골라주세요.');
        return;
      }
      toast.error('사진을 되돌리지 못했어요.');
    },
  });
}
