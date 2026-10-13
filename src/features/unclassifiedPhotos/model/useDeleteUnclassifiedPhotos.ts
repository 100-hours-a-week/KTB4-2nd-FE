'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deletePhoto, deletePhotos } from '@/features/photoList';
import { tripDetailQueries, unclassifiedPhotosQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

export function useDeleteUnclassifiedPhotos(tripId: number) {
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: unclassifiedPhotosQueries.tripKeys(tripId),
      });
      void queryClient.invalidateQueries({
        queryKey: tripDetailQueries.allKeys(),
        refetchType: 'none',
      });
      toast.success('사진이 삭제됐어요.');
    },
    onError: () => {
      toast.error('사진을 삭제하지 못했어요.');
    },
  });
}
