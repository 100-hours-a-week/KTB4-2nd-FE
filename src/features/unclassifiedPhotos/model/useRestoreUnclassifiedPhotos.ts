'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unclassifiedPhotosQueries } from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import {
  restoreUnclassifiedPhotos,
  type RestoreUnclassifiedTarget,
} from '../api/restoreUnclassifiedPhotos';

export function useRestoreUnclassifiedPhotos(tripId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (target: RestoreUnclassifiedTarget) => restoreUnclassifiedPhotos(tripId, target),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: unclassifiedPhotosQueries.tripKeys(tripId),
      });
      void queryClient.invalidateQueries({ queryKey: ['tripDetail'], refetchType: 'none' });
      void queryClient.invalidateQueries({ queryKey: ['photoList'], refetchType: 'none' });
      toast.success('사진을 원래 폴더로 되돌렸어요.');
    },
    onError: () => {
      toast.error('사진을 되돌리지 못했어요.');
    },
  });
}
