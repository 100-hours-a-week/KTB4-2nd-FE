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
      // 해제된 사진이 장소 폴더로 돌아가므로 다음 진입 때 폴더 목록을 다시 받습니다.
      void queryClient.invalidateQueries({ queryKey: ['tripDetail'], refetchType: 'none' });
      void queryClient.invalidateQueries({ queryKey: ['photoList'], refetchType: 'none' });
      toast.success('사진을 원래 폴더로 되돌렸어요.');
    },
    onError: () => {
      toast.error('사진을 되돌리지 못했어요.');
    },
  });
}
