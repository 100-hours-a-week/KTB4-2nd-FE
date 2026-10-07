'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearTripCreateDraft } from '@/features/createTrip/model/tripCreateDraft';
import { fetchCsrfToken } from '@/shared/api/browser';
import { clearIdentity } from '@/shared/lib/analytics';
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
      clearTripCreateDraft();
      clearIdentity();
      queryClient.clear();
      redirectToLogin();
    },
    onError: () => {
      toast.error('로그아웃하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
  });
}
