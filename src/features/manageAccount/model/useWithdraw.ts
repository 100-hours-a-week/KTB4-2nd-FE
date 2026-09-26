'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { withdraw } from '../api/withdraw';
import { redirectToLogin } from './redirectToLogin';

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken();
      await withdraw(csrfToken);
    },
    onSuccess: () => {
      queryClient.clear();
      redirectToLogin();
    },
    onError: (error) => {
      // 이미 탈퇴한 계정(404)이면 마이페이지에 머무를 이유가 없습니다.
      if (isAxiosError(error) && error.response?.status === 404) {
        queryClient.clear();
        redirectToLogin();
        return;
      }

      toast.error('탈퇴하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
  });
}
