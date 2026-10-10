'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { clearStoryGenerationJobs } from '@/features/createStory/model/storyGenerationStore';
import { clearTripCreateDraft } from '@/features/createTrip/model/tripCreateDraft';
import { fetchCsrfToken } from '@/shared/api/browser';
import { clearIdentity } from '@/shared/lib/analytics';
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
      clearStoryGenerationJobs();
      clearTripCreateDraft();
      clearIdentity();
      queryClient.clear();
      redirectToLogin();
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 404) {
        clearStoryGenerationJobs();
        clearTripCreateDraft();
        clearIdentity();
        queryClient.clear();
        redirectToLogin();
        return;
      }

      toast.error('탈퇴하지 못했어요. 잠시 후 다시 시도해주세요.');
    },
  });
}
