'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { storyCreateQueries, tripStoryQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { cancelStoryGeneration } from '../api/cancelStoryGeneration';
import { createStoryGeneration } from '../api/createStoryGeneration';
import {
  EMPTY_STORY_JOB,
  updateStoryGenerationJob,
  useStoryGenerationStore,
} from './storyGenerationStore';
import { getStoryCreateSubmitError, type StoryCreateSubmitError } from './submitError';
import type { StoryGenerationInput } from './types';

export function useStoryGeneration(tripId: number) {
  const queryClient = useQueryClient();
  const job = useStoryGenerationStore((state) => state.jobs[tripId] ?? EMPTY_STORY_JOB);
  const [now, setNow] = useState(() => Date.now());
  const creating = useRef(false);
  const canceling = useRef(false);
  const create = useMutation({
    mutationFn: async (input: StoryGenerationInput) => {
      const csrfToken = await fetchCsrfToken();
      return createStoryGeneration(
        tripId,
        {
          mood: input.mood,
          tripPlaceIds: input.folderIds,
        },
        csrfToken,
      );
    },
    onSuccess: ({ generationId }, input) => {
      if (useStoryGenerationStore.getState().jobs[tripId]?.input !== input) return;
      const startedAt = Date.now();
      setNow(startedAt);
      updateStoryGenerationJob(tripId, { generationId, startedAt });
    },
    onError: (error) => {
      const submitError = getStoryCreateSubmitError(error);
      if (submitError.kind === 'alreadyExists') toast.info(submitError.message);
      else toast.error(submitError.message);
    },
    onSettled: () => {
      creating.current = false;
    },
  });
  const cancelMutation = useMutation({
    mutationFn: async (generationId: number) => {
      const csrfToken = await fetchCsrfToken();
      await cancelStoryGeneration(generationId, csrfToken);
    },
    onSuccess: (_data, generationId) => {
      queryClient.removeQueries({
        queryKey: storyCreateQueries.generationStatusKeys(generationId),
      });
      if (useStoryGenerationStore.getState().jobs[tripId]?.generationId === generationId) {
        updateStoryGenerationJob(tripId, { generationId: null, startedAt: null });
      }
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        toast.info('스토리가 거의 완성되어 취소할 수 없어요.');
      } else toast.error('스토리 생성을 취소하지 못했어요.');
    },
    onSettled: () => {
      canceling.current = false;
    },
  });
  const statusQuery = useQuery({
    ...storyCreateQueries.generationStatus(job.generationId ?? 0),
    enabled: job.generationId !== null,
  });
  const result = job.generationId !== null ? statusQuery.data : undefined;
  const jobGone = isAxiosError(statusQuery.error) && statusQuery.error.response?.status === 404;
  const status = create.isPending
    ? 'processing'
    : job.generationId === null || jobGone || result?.status === 'CANCELED'
      ? 'idle'
      : result?.status === 'COMPLETED'
        ? 'completed'
        : result?.status === 'FAILED'
          ? 'failed'
          : 'processing';
  const preparing = !result || result.status === 'QUEUED';
  const progressPercent =
    status === 'completed' ? 100 : preparing ? 0 : Math.min(99, Math.max(0, result.progress));
  const elapsed =
    status === 'processing' && job.startedAt !== null
      ? Math.max(0, Math.floor((now - job.startedAt) / 1000))
      : 0;

  useEffect(() => {
    if (status !== 'processing') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'failed') toast.error('잠시 후 다시 시도해주세요.');
    if (status !== 'completed') return;
    void queryClient.invalidateQueries({ queryKey: tripStoryQueries.detail(tripId).queryKey });
    void queryClient.invalidateQueries({ queryKey: ['tripDetail'], refetchType: 'none' });
  }, [queryClient, status, tripId]);

  function start(
    input: StoryGenerationInput,
    options?: { onError?: (error: StoryCreateSubmitError) => void },
  ) {
    if (creating.current || status === 'processing') return;
    creating.current = true;
    updateStoryGenerationJob(tripId, { generationId: null, startedAt: null, input });
    create.mutate(input, {
      onError: (error) => options?.onError?.(getStoryCreateSubmitError(error)),
    });
  }

  function cancel(options?: { onSuccess?: () => void }) {
    if (job.generationId === null || canceling.current || create.isPending) return;
    canceling.current = true;
    const generationId = job.generationId;
    cancelMutation.mutate(generationId, { onSuccess: options?.onSuccess });
  }

  return {
    status,
    input: job.input,
    progressPercent,
    elapsed,
    message: preparing ? '스토리 생성을 준비하고 있어요' : '회원님의 사진을 살펴보고 있어요',
    isCanceling: cancelMutation.isPending,
    canCancel: job.generationId !== null && !create.isPending,
    start,
    cancel,
    reset: () => updateStoryGenerationJob(tripId, { generationId: null, startedAt: null }),
  };
}
