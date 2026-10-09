'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unclassifiedPhotosQueries } from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import { deleteUnclassifiedPhotos } from '../api/deleteUnclassifiedPhotos';

export function useDeleteUnclassifiedPhotos(tripId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (photoIds: number[]) => deleteUnclassifiedPhotos(tripId, photoIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: unclassifiedPhotosQueries.tripKeys(tripId),
      });
      void queryClient.invalidateQueries({ queryKey: ['tripDetail'], refetchType: 'none' });
      toast.success('사진이 삭제됐어요.');
    },
    onError: () => {
      toast.error('사진을 삭제하지 못했어요.');
    },
  });
}
