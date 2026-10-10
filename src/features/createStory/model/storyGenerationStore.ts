'use client';

import { create } from 'zustand';
import { toast } from '@/shared/ui/toast';
import type { StoryGenerationInput, StoryProgressEvent, StoryGenerationRequest } from './types';

type StoryJob = {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  elapsed: number;
  progressPercent: number;
  message: string;
  input: StoryGenerationInput | null;
};
export const EMPTY_STORY_JOB: StoryJob = {
  status: 'idle',
  elapsed: 0,
  progressPercent: 0,
  message: '회원님의 사진을 살펴보고 있어요',
  input: null,
};
export const useStoryGenerationStore = create<{ jobs: Record<number, StoryJob> }>(() => ({
  jobs: {},
}));
const running = new Map<
  number,
  {
    controller: AbortController;
    clock: ReturnType<typeof setInterval>;
    deadline: ReturnType<typeof setTimeout>;
  }
>();

function update(tripId: number, patch: Partial<StoryJob>) {
  useStoryGenerationStore.setState((state) => ({
    jobs: { ...state.jobs, [tripId]: { ...(state.jobs[tripId] ?? EMPTY_STORY_JOB), ...patch } },
  }));
}
function release(tripId: number) {
  const run = running.get(tripId);
  if (!run) return;
  clearInterval(run.clock);
  clearTimeout(run.deadline);
  running.delete(tripId);
}
export function cancelStoryGeneration(tripId: number) {
  const run = running.get(tripId);
  release(tripId);
  // TODO: 실제 생성 API 연동 시 서버 작업 중단 요청도 연결합니다.
  run?.controller.abort();
  update(tripId, {
    status: 'idle',
    elapsed: 0,
    progressPercent: 0,
    message: EMPTY_STORY_JOB.message,
  });
}

export async function startStoryGeneration(
  input: StoryGenerationInput,
  request?: StoryGenerationRequest,
) {
  if (!request) {
    toast.warning('스토리 생성 기능을 준비하고 있어요.');
    return;
  }
  const tripId = input.tripId;
  if (running.has(tripId)) return;
  const controller = new AbortController();
  const started = Date.now();
  const clock = setInterval(
    () => update(tripId, { elapsed: Math.floor((Date.now() - started) / 1000) }),
    1000,
  );
  const deadline = setTimeout(() => {
    if (running.get(tripId)?.controller !== controller) return;
    release(tripId);
    controller.abort();
    update(tripId, { status: 'failed', elapsed: 180 });
    toast.error('잠시 후 다시 시도해주세요.');
  }, 180000);
  running.set(tripId, { controller, clock, deadline });
  update(tripId, {
    ...EMPTY_STORY_JOB,
    status: 'processing',
    input: { ...input, folderIds: [...input.folderIds] },
  });
  function receiveProgress(event: StoryProgressEvent) {
    if (running.get(tripId)?.controller !== controller) return;
    const current = useStoryGenerationStore.getState().jobs[tripId];
    const percent = Number.isFinite(event.progressPercent)
      ? Math.max(
          current.progressPercent,
          Math.min(99, Math.max(0, Math.floor(event.progressPercent))),
        )
      : current.progressPercent;
    update(tripId, { progressPercent: percent, message: event.message || current.message });
  }
  try {
    // TODO: 실제 SSE/웹소켓 수신 어댑터로 교체. 완료 이벤트에서 resolve, 실패 시 reject합니다.
    await request(input, controller.signal, receiveProgress);
    if (running.get(tripId)?.controller === controller) {
      update(tripId, {
        status: 'completed',
        progressPercent: 100,
        message: '스토리가 생성되었어요',
      });
    }
  } catch {
    if (running.get(tripId)?.controller === controller && !controller.signal.aborted) {
      update(tripId, { status: 'failed' });
      toast.error('잠시 후 다시 시도해주세요.');
    }
  } finally {
    if (running.get(tripId)?.controller === controller) release(tripId);
  }
}

/** 화면 이동과 달리 세션 종료 시에는 메모리에 남은 작업·선택 정보도 정리합니다. */
export function clearStoryGenerationJobs() {
  for (const [tripId, run] of running) {
    release(tripId);
    run.controller.abort();
  }
  useStoryGenerationStore.setState({ jobs: {} });
}
