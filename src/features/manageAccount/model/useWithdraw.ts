'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { withdraw } from '../api/withdraw';
import { clearUserLocalData } from './clearUserLocalData';
import { redirectToLogin } from './redirectToLogin';

export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken();
      await withdraw(csrfToken);
    },
    onSuccess: () => {
      clearUserLocalData();
      queryClient.clear();
      redirectToLogin();
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 404) {
        clearUserLocalData();
        queryClient.clear();
        redirectToLogin();
        return;
      }

      toast.error('탈퇴하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
  });
}
