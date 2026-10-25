'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deletePhoto, deletePhotos, getPhotoDeleteErrorMessage } from '@/features/photoList';
import { invalidateTripData } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { removeCachedUnclassifiedPhotos } from './removeCachedUnclassifiedPhotos';

export function useDeleteUnclassifiedPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoIds: number[]) => {
      const csrfToken = await fetchCsrfToken();

      if (photoIds.length === 1) {
        await deletePhoto(photoIds[0], csrfToken);
        return;
      }

      await deletePhotos(photoIds, csrfToken);
    },
    onSuccess: async (_data, photoIds) => {
      removeCachedUnclassifiedPhotos(queryClient, photoIds);
      await invalidateTripData(queryClient);
      toast.success('사진이 삭제됐어요.');
    },
    onError: (error) => {
      toast.error(getPhotoDeleteErrorMessage(error));
    },
  });
}
