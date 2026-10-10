'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { TripDetail, TripPlaceFolder } from '@/features/tripDetail';
import {
  STORY_FOLDER_LIMIT,
  STORY_MOODS,
  type StoryMood,
  type StoryGenerationRequest,
} from '@/features/createStory/model/types';
import { useStoryGeneration } from '@/features/createStory/model/useStoryGeneration';
import { tripDetailQueries } from '@/queryFactory';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogActions } from '@/shared/ui/dialog';
import { PageHeader } from '@/shared/ui/pageHeader';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';
import { StoryGenerationView } from './storyGenerationView';

export function StoryCreatePage({
  trip,
  nickname = '회원',
  runGeneration,
}: {
  trip: TripDetail;
  nickname?: string;
  runGeneration?: StoryGenerationRequest;
}) {
  const router = useRouter();
  const generation = useStoryGeneration(trip.id, runGeneration);
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
    void generation.start({ tripId: trip.id, mood, folderIds: [...selectedIds] });
  }
  function back() {
    if (generation.status === 'processing') setCancelOpen(true);
    else if (processing) {
      generation.cancel();
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
          <div className="mt-3 shrink-0">
            <p
              aria-label="여행 요약"
              className="text-muted inline-flex max-w-full items-center gap-2 rounded-full bg-[#eef3f9] px-3 py-1.5 text-[11px] font-semibold"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
              </svg>
              <span className="truncate">
                {trip.name} · {trip.startDate.slice(5).replace('-', '.')} –{' '}
                {trip.endDate.slice(5).replace('-', '.')} · {trip.photoCount}장
              </span>
            </p>
            <h2 className="mt-6 text-[23px] leading-[1.35] font-extrabold tracking-[-0.04em]">
              이번 여행, 어떤{' '}
              {step === 'mood' ? (
                <>
                  분위기로
                  <br />
                  기록할까요?
                </>
              ) : (
                <>
                  폴더를
                  <br />
                  스토리로 만들까요?
                </>
              )}
            </h2>
            <div className="mt-3 mb-5 flex items-center justify-between gap-2">
              <p className="text-muted text-[12px]">
                {step === 'mood'
                  ? '선택한 분위기에 맞춰 사진을 고르고 스토리를 써드려요.'
                  : '폴더를 선택하면 스토리를 써드려요.'}
              </p>
              {step === 'folder' && (
                <p
                  aria-label="선택한 폴더 수"
                  className="text-muted shrink-0 rounded-full bg-[#eef3f9] px-2.5 py-1 text-xs"
                >
                  <strong className="text-brand">{selectedIds.size}</strong> / 10
                </p>
              )}
            </div>
          </div>
          {step === 'mood' ? (
            <fieldset className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <legend className="sr-only">스토리 분위기 선택</legend>
              {STORY_MOODS.map((option) => (
                <label
                  key={option.value}
                  className={`relative flex min-h-[72px] cursor-pointer items-center justify-between gap-3 rounded-[16px] border px-4 py-3 transition-colors ${mood === option.value ? 'border-brand bg-surface-subtle ring-brand ring-1 ring-inset' : 'border-border-subtle'}`}
                >
                  <span>
                    <strong className="block text-sm font-extrabold">{option.label}</strong>
                    <span className="text-muted mt-1 block text-[11px]">{option.description}</span>
                  </span>
                  <input
                    type="radio"
                    name="story-mood"
                    value={option.value}
                    checked={mood === option.value}
                    onChange={() => setMood(option.value)}
                    className="focus-visible:outline-brand size-5 shrink-0 appearance-none rounded-full border-2 border-slate-300 bg-white checked:border-[6px] checked:border-brand focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                </label>
              ))}
            </fieldset>
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
      <Dialog
        open={cancelOpen && generation.status === 'processing'}
        onClose={() => setCancelOpen(false)}
        title="스토리 생성을 취소할까요?"
        description="지금 취소하면 폴더 선택 화면으로 돌아가요."
      >
        <DialogActions>
          <Button
            variant="secondary"
            onClick={() => {
              generation.cancel();
              setCancelOpen(false);
              setStep('folder');
            }}
            className="w-full min-h-11 px-0 text-sm"
          >
            취소하기
          </Button>
          <Button onClick={() => setCancelOpen(false)} className="w-full min-h-11 px-0 text-sm">
            이어서 만들기
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

function StoryFolderGrid({
  tripId,
  selectedIds,
  onToggle,
}: {
  tripId: number;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  const query = useInfiniteQuery(tripDetailQueries.placeFolders(tripId));
  const [visibleCount, setVisibleCount] = useState(6);
  const root = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const folders = query.data?.pages.flatMap((page) => page.folders) ?? [];
  const { hasNextPage, isFetchingNextPage, isError, fetchNextPage } = query;
  const hasMore = visibleCount < folders.length || hasNextPage;
  useEffect(() => {
    if (!sentinel.current || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || isFetchingNextPage || isError) return;
        if (visibleCount < folders.length) setVisibleCount((count) => count + 6);
        else if (hasNextPage) void fetchNextPage();
      },
      { root: root.current, rootMargin: '80px' },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [
    hasMore,
    visibleCount,
    folders.length,
    hasNextPage,
    isFetchingNextPage,
    isError,
    fetchNextPage,
  ]);

  return (
    <div
      ref={root}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="스토리를 만들 폴더 목록"
      tabIndex={0}
    >
      {query.isPending ? (
        <div role="status" aria-label="폴더 불러오는 중" className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[0.94] rounded-[18px]" />
          ))}
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3">
            {folders.slice(0, visibleCount).map((folder) => (
              <li key={folder.id}>
                <FolderChoice
                  folder={folder}
                  selected={selectedIds.has(folder.id)}
                  onToggle={() => onToggle(folder.id)}
                />
              </li>
            ))}
          </ul>
          {query.isError ? (
            <div role="alert" className="py-8 text-center">
              <p className="text-muted mb-3 text-xs">폴더를 불러오지 못했어요.</p>
              <Button variant="secondary" onClick={() => void query.refetch()} className="text-sm">
                다시 시도
              </Button>
            </div>
          ) : folders.length === 0 ? (
            <p className="text-muted py-16 text-center text-sm">
              스토리를 만들 폴더가 없어요.
              <br />
              사진을 정리한 뒤 다시 방문해 주세요.
            </p>
          ) : null}
          {hasMore && !query.isError && (
            <div ref={sentinel} className="pt-4 text-center">
              <Button
                variant="ghost"
                disabled={query.isFetchingNextPage}
                onClick={() => {
                  if (visibleCount < folders.length) setVisibleCount((count) => count + 6);
                  else void query.fetchNextPage();
                }}
                className="text-xs"
              >
                {query.isFetchingNextPage ? '불러오는 중...' : '폴더 더 보기'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FolderChoice({
  folder,
  selected,
  onToggle,
}: {
  folder: TripPlaceFolder;
  selected: boolean;
  onToggle: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const colors = {
    coast: 'from-[#b5def4] to-[#306762]',
    sunset: 'from-[#ffd299] via-[#f9a393] to-[#1b2c51]',
    island: 'from-[#78cae8] via-[#a4e4ed] to-[#32495c]',
    night: 'from-[#33476c] to-[#14233c]',
    field: 'from-[#d6edda] to-[#71a48c]',
    sky: 'from-[#dce6fa] to-[#668cab]',
  };
  return (
    <label
      className={`relative block aspect-[0.94] cursor-pointer overflow-hidden rounded-[18px] bg-gradient-to-b ${colors[folder.accent]}`}
    >
      {folder.thumbnailUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- API 썸네일은 임의의 presigned URL이므로 브라우저에서 직접 로드합니다.
        <img
          src={folder.thumbnailUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">
          <span className="absolute top-[32%] right-[20%] size-10 rounded-full bg-[#fff3c7]" />
          <span className="absolute -bottom-4 -left-5 h-[45%] w-[120%] rounded-[50%] bg-brand/25" />
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#021730]/85 to-transparent"
      />
      <input
        type="checkbox"
        aria-label={`${folder.name} 사진 ${folder.photoCount}장 선택`}
        checked={selected}
        onChange={onToggle}
        className="peer focus-visible:outline-brand absolute top-3 left-3 z-10 size-6 cursor-pointer appearance-none rounded-lg border border-[#021730]/15 bg-white/85 checked:border-brand checked:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-3 left-3 z-10 hidden size-6 p-1 peer-checked:block"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      {selected && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[18px] border-[3px] border-brand"
        />
      )}
      <span className="absolute right-3 bottom-3 left-3 text-white">
        <strong className="block truncate text-sm font-extrabold">{folder.name}</strong>
        <span className="mt-1 block text-[11px]">{folder.photoCount}장</span>
      </span>
    </label>
  );
}
