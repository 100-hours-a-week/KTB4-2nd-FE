'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';

import { photoListQueries, tripDetailQueries, tripListQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { deleteTrip } from '../api/deleteTrip';

function getFailureMessage(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 409) return '사진을 정리하는 중에는 삭제할 수 없어요.';
    if (error.response?.status === 404) return '이미 삭제된 여행이에요.';
  }

  return '여행을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.';
}

export function useDeleteTrip(tripId: number) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken();
      await deleteTrip(tripId, csrfToken);
    },
    onSuccess: () => {
      // 목록·지도·상세·사진 캐시에 남은 여행을 모두 걷어냅니다.
      queryClient.removeQueries({ queryKey: tripDetailQueries.allKeys() });
      queryClient.removeQueries({ queryKey: photoListQueries.allKeys() });
      void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
      void queryClient.invalidateQueries({ queryKey: ['mainMap'] });

      toast.success('여행을 삭제했어요.');
      // 삭제된 여행 화면으로 되돌아오지 않도록 현재 기록을 대체합니다.
      router.replace('/trips');
    },
    onError: (error) => {
      // 이미 없는 여행이면 상세에 머무를 이유가 없습니다.
      if (isAxiosError(error) && error.response?.status === 404) {
        void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
        toast.error(getFailureMessage(error));
        router.replace('/trips');
        return;
      }

      toast.error(getFailureMessage(error));
    },
  });
}
