'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TripDetail } from '@/features/tripDetail';
import { STORY_FOLDER_LIMIT, type StoryMood } from '@/features/createStory/model/types';
import { useStoryGeneration } from '@/features/createStory/model/useStoryGeneration';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/pageHeader';
import { toast } from '@/shared/ui/toast';
import { StoryCancelDialog } from './storyCancelDialog';
import { StoryFolderGrid } from './storyFolderGrid';
import { StoryCreateIntro } from './storyCreateIntro';
import { StoryMoodSelector } from './storyMoodSelector';
import { StoryGenerationView } from './storyGenerationView';

export function StoryCreatePage({
  trip,
  nickname = '회원',
}: {
  trip: TripDetail;
  nickname?: string;
}) {
  const router = useRouter();
  const generation = useStoryGeneration(trip.id);
  const [step, setStep] = useState<'mood' | 'folder'>('mood');
  const [mood, setMood] = useState<StoryMood | null>(generation.input?.mood ?? null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(generation.input?.folderIds ?? []),
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const processing = generation.status !== 'idle';

  function start() {
    setCancelOpen(false);
    if (!mood || selectedIds.size === 0) return;
    generation.start(
      { tripId: trip.id, mood, folderIds: [...selectedIds] },
      {
        onError: (error) => {
          if (error.kind === 'alreadyExists') router.replace(`/trips/${trip.id}/story`);
          else if (error.kind === 'retry' && error.step) setStep(error.step);
        },
      },
    );
  }
  function back() {
    if (generation.status === 'processing') setCancelOpen(true);
    else if (processing) {
      generation.reset();
      setStep('folder');
    } else if (step === 'folder') {
      setSelectedIds(new Set());
      setStep('mood');
    } else router.push(`/trips/${trip.id}`);
  }
  function toggleFolder(id: number) {
    if (!selectedIds.has(id) && selectedIds.size >= STORY_FOLDER_LIMIT) {
      toast.warning('폴더는 최대 10개까지 선택할 수 있어요.');
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
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
          onContinueElsewhere={() => router.push(`/trips/${trip.id}`)}
          onBack={back}
          onView={() => router.push(`/trips/${trip.id}/story`)}
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
          <StoryCreateIntro trip={trip} step={step} selectedCount={selectedIds.size} />
          {step === 'mood' ? (
            <StoryMoodSelector mood={mood} onChange={setMood} />
          ) : (
            <StoryFolderGrid tripId={trip.id} selectedIds={selectedIds} onToggle={toggleFolder} />
          )}
          <footer className="bg-surface before:from-surface relative shrink-0 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:to-transparent">
            <Button
              disabled={step === 'mood' ? !mood : selectedIds.size === 0}
              onClick={step === 'mood' ? () => setStep('folder') : start}
              className="w-full gap-2 rounded-[16px] text-sm disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100"
            >
              생성{' '}
              {step === 'folder' && selectedIds.size > 0 && (
                <span
                  aria-hidden="true"
                  className="grid size-5 place-items-center rounded-full bg-white/20 text-[11px]"
                >
                  {selectedIds.size}
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
        onClose={() => setCancelOpen(false)}
        onConfirm={() =>
          generation.cancel({
            onSuccess: () => {
              setCancelOpen(false);
              setStep('folder');
            },
          })
        }
      />
    </main>
  );
}
