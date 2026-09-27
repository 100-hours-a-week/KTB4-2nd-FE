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
      queryClient.removeQueries({ queryKey: tripDetailQueries.allKeys() });
      queryClient.removeQueries({ queryKey: photoListQueries.allKeys() });
      void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
      void queryClient.invalidateQueries({ queryKey: ['mainMap'] });

      toast.success('여행을 삭제했어요.');
      router.replace('/trips');
    },
    onError: (error) => {
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
