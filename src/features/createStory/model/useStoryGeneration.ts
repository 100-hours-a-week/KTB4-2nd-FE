'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { storyCreateQueries, tripStoryQueries } from '@/queryFactory';
import { fetchCsrfToken } from '@/shared/api/browser';
import { toast } from '@/shared/ui/toast';

import { cancelStoryGeneration } from '../api/cancelStoryGeneration';
import {
  createStoryGeneration,
  type CreateStoryGenerationRequest,
} from '../api/createStoryGeneration';
import {
  clearStoryCreateDraft,
  readStoryCreateDraft,
  updateStoryCreateDraft,
} from './storyCreateDraft';
import { getStoryCreateSubmitError, type StoryCreateSubmitError } from './submitError';

export type StoryGenerationViewStatus = 'idle' | 'processing' | 'completed' | 'failed';

type StoryJob = { generationId: number | null; startedAt: number | null };

const EMPTY_JOB: StoryJob = { generationId: null, startedAt: null };
const PREPARING_MESSAGE = '스토리 생성을 준비하고 있어요';
const WRITING_MESSAGE = '회원님의 사진을 살펴보고 있어요';

export function useStoryGeneration(tripId: number) {
  const queryClient = useQueryClient();
  const [job, setJob] = useState<StoryJob>(() => {
    const { generationId, startedAt } = readStoryCreateDraft(tripId);
    return { generationId, startedAt };
  });
  const [now, setNow] = useState(() => Date.now());
  const creating = useRef(false);
  const canceling = useRef(false);

  const create = useMutation({
    mutationFn: async (request: CreateStoryGenerationRequest) => {
      const csrfToken = await fetchCsrfToken();
      const created = await createStoryGeneration(tripId, request, csrfToken);
      return { ...created, startedAt: Date.now() };
    },
    onSuccess: ({ generationId, startedAt }, request) => {
      const draft = readStoryCreateDraft(tripId);
      if (
        draft.mood !== request.mood ||
        draft.tripPlaceIds.length !== request.tripPlaceIds.length ||
        !draft.tripPlaceIds.every((id, index) => id === request.tripPlaceIds[index])
      )
        return;
      setNow(startedAt);
      changeJob({ generationId, startedAt });
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
      if (readStoryCreateDraft(tripId).generationId === generationId) changeJob(EMPTY_JOB);
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
  const status: StoryGenerationViewStatus = create.isPending
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
    if (status === 'failed') {
      toast.error('잠시 후 다시 시도해주세요.');
      updateStoryCreateDraft(tripId, EMPTY_JOB);
      return;
    }
    if (status !== 'completed') return;

    clearStoryCreateDraft(tripId);
    void queryClient.invalidateQueries({ queryKey: tripStoryQueries.detail(tripId).queryKey });
    void queryClient.invalidateQueries({ queryKey: ['tripDetail'], refetchType: 'none' });
  }, [queryClient, status, tripId]);

  function changeJob(nextJob: StoryJob) {
    setJob(nextJob);
    updateStoryCreateDraft(tripId, nextJob);
  }

  function start(
    request: CreateStoryGenerationRequest,
    options?: { onError?: (error: StoryCreateSubmitError) => void },
  ) {
    if (creating.current || status === 'processing') return;
    creating.current = true;

    changeJob(EMPTY_JOB);
    updateStoryCreateDraft(tripId, request);
    create.mutate(request, {
      onError: (error) => options?.onError?.(getStoryCreateSubmitError(error)),
    });
  }

  function cancel(options?: { onSuccess?: () => void }) {
    const { generationId } = job;
    if (generationId === null || canceling.current || create.isPending) return;
    canceling.current = true;

    cancelMutation.mutate(generationId, { onSuccess: options?.onSuccess });
  }

  return {
    status,
    progressPercent,
    elapsed,
    message: preparing ? PREPARING_MESSAGE : WRITING_MESSAGE,
    isCanceling: cancelMutation.isPending,
    canCancel: job.generationId !== null && !create.isPending,
    start,
    cancel,
    /** 실패·완료 화면에서 나갈 때 진행 기록을 지웁니다. */
    reset: () => changeJob(EMPTY_JOB),
  };
}
