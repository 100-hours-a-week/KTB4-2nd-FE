'use client';

import { create } from 'zustand';
import type { StoryGenerationInput } from './types';

type StoryJob = {
  generationId: number | null;
  startedAt: number | null;
  input: StoryGenerationInput | null;
};
export const EMPTY_STORY_JOB: StoryJob = {
  generationId: null,
  startedAt: null,
  input: null,
};
export const useStoryGenerationStore = create<{ jobs: Record<number, StoryJob> }>(() => ({
  jobs: {},
}));

export function updateStoryGenerationJob(tripId: number, patch: Partial<StoryJob>) {
  useStoryGenerationStore.setState((state) => ({
    jobs: { ...state.jobs, [tripId]: { ...(state.jobs[tripId] ?? EMPTY_STORY_JOB), ...patch } },
  }));
}

export function clearStoryGenerationJobs() {
  useStoryGenerationStore.setState({ jobs: {} });
}
