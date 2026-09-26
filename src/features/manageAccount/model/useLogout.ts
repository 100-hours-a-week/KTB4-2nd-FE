'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { logout } from '../api/logout';
import { redirectToLogin } from './redirectToLogin';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken();
      await logout(csrfToken);
    },
    onSuccess: () => {
      queryClient.clear();
      redirectToLogin();
    },
    onError: () => {
      toast.error('로그아웃하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
  });
}
