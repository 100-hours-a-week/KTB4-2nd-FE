'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  clearStoryCreateDraft,
  useStoryCreateForm,
  useStoryCreateFunnel,
  useStoryGeneration,
  type StoryCreateStep,
} from '@/features/createStory';
import type { TripDetail } from '@/features/tripDetail';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/pageHeader';
import { StoryCancelDialog } from './storyCancelDialog';
import { StoryCreateIntro } from './storyCreateIntro';
import { StoryFolderGrid } from './storyFolderGrid';
import { StoryGenerationView } from './storyGenerationView';
import { StoryMoodSelector } from './storyMoodSelector';

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
  const { step, goToStep, replaceStep } = useStoryCreateFunnel(initialStep);
  const form = useStoryCreateForm(trip.id);
  const { getValues } = form;
  const [cancelOpen, setCancelOpen] = useState(false);
  const processing = generation.status !== 'idle';

  useEffect(() => {
    if (step === 'folder' && !getValues('mood')) replaceStep('mood');
  }, [getValues, replaceStep, step]);

  function start() {
    setCancelOpen(false);
    const values = getValues();
    if (!values.mood || values.tripPlaceIds.length === 0) return;
    generation.start(
      { mood: values.mood, tripPlaceIds: values.tripPlaceIds },
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
    else if (processing) {
      generation.reset();
      replaceStep('folder');
    } else if (step === 'folder') {
      form.clearFolders();
      replaceStep('mood');
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
          progressPercent={generation.progressPercent}
          message={generation.message}
          onContinueElsewhere={() => router.replace(`/trips/${trip.id}`)}
          onBack={back}
          onView={() => router.replace(`/trips/${trip.id}/story`)}
          onRetry={start}
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
            />
          )}
          <footer className="bg-surface before:from-surface relative shrink-0 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:to-transparent">
            <Button
              disabled={step === 'mood' ? !form.mood : form.selectedIds.length === 0}
              onClick={step === 'mood' ? () => goToStep('folder') : start}
              className="w-full gap-2 rounded-[16px] text-sm disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100"
            >
              생성{' '}
              {step === 'folder' && form.selectedIds.length > 0 && (
                <span
                  aria-hidden="true"
                  className="grid size-5 place-items-center rounded-full bg-white/20 text-[11px]"
                >
                  {form.selectedIds.length}
                </span>
              )}
            </Button>
          </footer>
        </>
      )}
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
