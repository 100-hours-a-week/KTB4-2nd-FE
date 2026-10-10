'use client';

import type { StoryGenerationInput, StoryGenerationRequest } from './types';

import {
  cancelStoryGeneration,
  EMPTY_STORY_JOB,
  startStoryGeneration,
  useStoryGenerationStore,
} from './storyGenerationStore';

export function useStoryGeneration(tripId: number, request?: StoryGenerationRequest) {
  const job = useStoryGenerationStore((state) => state.jobs[tripId] ?? EMPTY_STORY_JOB);
  return {
    ...job,
    start: (input: StoryGenerationInput) => startStoryGeneration(input, request),
    cancel: () => cancelStoryGeneration(tripId),
  };
}
