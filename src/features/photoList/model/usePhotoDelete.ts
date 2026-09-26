'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { photoListQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { deletePhoto, deletePhotos } from '../api/photoDelete';

export function usePhotoDelete(tripId: number, tripPlaceId: number) {
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
      // 삭제로 장수와 폴더 썸네일이 바뀌므로 목록과 여행 상세를 다시 받습니다.
      await queryClient.invalidateQueries({
        queryKey: photoListQueries.placePhotoKeys(tripId, tripPlaceId),
      });
      void queryClient.invalidateQueries({ queryKey: ['tripDetail'], refetchType: 'none' });
      toast.success('사진이 삭제됐어요.');
    },
    onError: () => {
      toast.error('사진을 삭제하지 못했어요.');
    },
  });
}
