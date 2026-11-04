'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AiUnavailableDialog, useAiReadyGuard } from '@/features/aiStatus';
import {
  clearStoryCreateDraft,
  useStoryCreateForm,
  useStoryCreateFunnel,
  useStoryGeneration,
  type StoryCreateStep,
  type StoryMood,
} from '@/features/createStory';
import type { TripDetail } from '@/features/tripDetail';
import { PageHeader } from '@/shared/ui/pageHeader';
import { StoryCancelDialog } from './components/storyCancelDialog';
import { StoryCreateActions } from './components/storyCreateActions';
import { StoryCreateIntro } from './components/storyCreateIntro';
import { StoryFolderGrid } from './components/storyFolderGrid';
import { StoryGenerationView } from './components/storyGenerationView';
import { StoryMoodSelector } from './components/storyMoodSelector';

const subscribeNothing = () => () => {};

type StoryCreatePageProps = {
  trip: TripDetail;
  nickname?: string;
  initialStep?: StoryCreateStep;
};

export function StoryCreatePage(props: StoryCreatePageProps) {
  const isClient = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  return isClient ? <StoryCreateContent {...props} /> : null;
}

function StoryCreateContent({
  trip,
  nickname = '회원',
  initialStep = 'mood',
}: StoryCreatePageProps) {
  const router = useRouter();
  const generation = useStoryGeneration(trip.id);
  const { step, goToStep, replaceStep, returnToStep } = useStoryCreateFunnel(initialStep);
  const form = useStoryCreateForm(trip.id);
  const { getValues } = form;
  const [cancelOpen, setCancelOpen] = useState(false);
  const aiGuard = useAiReadyGuard();
  const processing = generation.status !== 'idle';

  useEffect(() => {
    if (step === 'folder' && !getValues('mood')) replaceStep('mood');
  }, [getValues, replaceStep, step]);

  function start() {
    setCancelOpen(false);
    const { mood, tripPlaceIds } = getValues();
    if (!mood || tripPlaceIds.length === 0) return;
    void aiGuard.runWhenAiReady(() => requestGeneration(mood, tripPlaceIds));
  }
  function requestGeneration(mood: StoryMood, tripPlaceIds: number[]) {
    generation.start(
      { mood, tripPlaceIds },
      {
        onError: (error) => {
          if (error.kind === 'alreadyExists') {
            clearStoryCreateDraft(trip.id);
            router.replace(`/trips/${trip.id}/story`);
          } else if (error.kind === 'retry' && error.step && error.step !== step) {
            goToStep(error.step);
          }
        },
      },
    );
  }
  function back() {
    if (generation.status === 'processing') setCancelOpen(true);
    else if (generation.status === 'completed') {
      router.replace(`/trips/${trip.id}`);
    } else if (processing) {
      generation.reset();
      replaceStep('folder');
    } else if (step === 'folder') {
      form.clearFolders();
      returnToStep('mood');
    } else {
      clearStoryCreateDraft(trip.id);
      router.replace(`/trips/${trip.id}`);
    }
  }
  function cancelGeneration() {
    generation.cancel({
      onSuccess: () => {
        setCancelOpen(false);
        replaceStep('folder');
      },
    });
  }

  return (
    <main className="text-brand bg-surface mx-auto flex h-[min(100dvh,var(--app-max-height))] w-full max-w-[430px] flex-col overflow-hidden px-6 pt-[max(8px,env(safe-area-inset-top))]">
      {processing ? (
        <StoryGenerationView
          nickname={nickname}
          status={generation.status as 'processing' | 'completed' | 'failed'}
          elapsed={generation.elapsed}
          message={generation.message}
          onContinueElsewhere={() => router.replace(`/trips/${trip.id}`)}
          onBack={back}
          onView={() => router.replace(`/trips/${trip.id}/story`)}
          onRetry={start}
          isRetrying={aiGuard.isChecking}
        />
      ) : (
        <>
          <PageHeader
            title={trip.name}
            onBack={back}
            backLabel={step === 'mood' ? '여행 상세로 돌아가기' : '분위기 선택으로 돌아가기'}
            className="shrink-0"
          />
          <StoryCreateIntro trip={trip} step={step} selectedCount={form.selectedIds.length} />
          {step === 'mood' ? (
            <StoryMoodSelector mood={form.mood} onChange={form.setMood} />
          ) : (
            <StoryFolderGrid
              tripId={trip.id}
              selectedIds={form.selectedIds}
              onToggle={form.toggleFolder}
              onUnavailableSelected={form.removeFolders}
            />
          )}
          <StoryCreateActions
            step={step}
            selectedCount={form.selectedIds.length}
            canProceed={step === 'mood' ? !!form.mood : form.selectedIds.length > 0}
            isChecking={aiGuard.isChecking}
            onProceed={step === 'mood' ? () => goToStep('folder') : start}
          />
        </>
      )}
      <AiUnavailableDialog
        reason={aiGuard.unavailableReason}
        onClose={aiGuard.closeUnavailableDialog}
      />
      <StoryCancelDialog
        open={cancelOpen && generation.status === 'processing'}
        canCancel={generation.canCancel}
        isCanceling={generation.isCanceling}
        onConfirm={cancelGeneration}
        onClose={() => setCancelOpen(false)}
      />
    </main>
  );
}
