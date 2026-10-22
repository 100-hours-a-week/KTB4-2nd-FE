'use client';

import { useQueries, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { storyCreateQueries, tripDetailQueries, tripStoryQueries } from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

import {
  clearStoryCreateDraft,
  getActiveStoryGenerationsSnapshot,
  parseActiveStoryGenerations,
  subscribeStoryCreateDrafts,
  updateStoryCreateDraft,
} from '../model/storyCreateDraft';

export function StoryGenerationWatcher() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const handled = useRef(new Set<number>());
  const snapshot = useSyncExternalStore(
    subscribeStoryCreateDrafts,
    getActiveStoryGenerationsSnapshot,
    () => '',
  );
  const jobs = useMemo(() => parseActiveStoryGenerations(snapshot), [snapshot]);
  const results = useQueries({
    queries: jobs.map((job) => storyCreateQueries.generationStatus(job.generationId)),
  });

  useEffect(() => {
    jobs.forEach((job, index) => {
      const { data, error } = results[index] ?? {};
      if (handled.current.has(job.generationId)) return;
      if (pathname === `/trips/${job.tripId}/story/create`) return;

      const gone = isAxiosError(error) && error.response?.status === 404;
      const status = data?.generationId === job.generationId ? data.status : undefined;
      if (!gone && status !== 'COMPLETED' && status !== 'FAILED' && status !== 'CANCELED') return;

      handled.current.add(job.generationId);

      if (status === 'COMPLETED') {
        clearStoryCreateDraft(job.tripId);
        void queryClient.invalidateQueries({
          queryKey: tripStoryQueries.detail(job.tripId).queryKey,
        });
        // 여행 상세의 스토리 보기 버튼(hasStory)이 바로 바뀌도록 요약도 다시 받습니다.
        void queryClient.invalidateQueries({
          queryKey: tripDetailQueries.summaryKeys(job.tripId),
        });
        toast.success('여행 스토리가 완성됐어요. 여행 상세에서 확인해 보세요.');
        return;
      }

      updateStoryCreateDraft(job.tripId, { generationId: null, startedAt: null });
      if (status === 'FAILED') {
        toast.error('여행 스토리를 만들지 못했어요. 다시 시도해 주세요.');
      }
    });
  }, [jobs, pathname, queryClient, results]);

  return null;
}
