'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  getStoryPhotoLabel,
  STORY_PHOTO_LIMIT,
  StoryPhotoViewer,
  type StoryPhoto,
  type TripStory,
} from '@/features/tripStory';
import { PageHeader } from '@/shared/ui/pageHeader';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { toast } from '@/shared/ui/toast';

const DAY_LABELS = ['첫째 날', '둘째 날', '셋째 날'];

export function TripStoryPage({
  story,
  isLoading = false,
  errorMessage,
  onRetry,
}: {
  story: TripStory;
  isLoading?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const entries = story.days
    .flatMap((day) => day.photos.map((photo) => ({ day, photo })))
    .slice(0, STORY_PHOTO_LIMIT);
  const activeIndex = entries.findIndex(({ photo }) => photo.id === activeId);
  const active = entries[activeIndex];
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace(`/trips/${story.tripId}`);
  };

  return (
    <main className="page-enter bg-surface text-brand mx-auto min-h-full w-full max-w-[430px] pb-10">
      <div className="border-border-subtle sticky top-0 z-20 border-b bg-white px-5 pt-[env(safe-area-inset-top)]">
        <PageHeader
          title="여행 스토리"
          onBack={handleBack}
          backLabel="여행 상세로 돌아가기"
          action={
            <button
              type="button"
              aria-label="스토리 편집 (준비 중)"
              onClick={() => toast.warning('아직 지원하지 않는 기능이에요.')}
              className="group focus-visible:outline-brand relative grid size-11 cursor-pointer place-items-center rounded-full hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <svg
                aria-hidden="true"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m16 3 5 5-12 12-6 1 1-6Z" />
                <path d="m14 5 5 5" />
              </svg>
            </button>
          }
        />
      </div>
      <section aria-label="여행 정보" className="border-border-subtle border-b px-5 pt-6 pb-5">
        <h2 className="text-[23px] font-extrabold tracking-[-0.04em]">{story.tripName}</h2>
        <p className="text-muted mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5">
            <MetaIcon /> {story.startDate.replaceAll('-', '.')} –{' '}
            {story.endDate.slice(5).replace('-', '.')}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MetaIcon photo /> {story.photoCount}장
          </span>
        </p>
      </section>
      {isLoading ? (
        <div role="status" aria-label="스토리 불러오는 중" className="space-y-5 px-5 py-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="ml-10 aspect-square w-[calc(100%-40px)] rounded-[18px]" />
          <Skeleton className="ml-10 h-4 w-48" />
        </div>
      ) : errorMessage ? (
        <section
          role="alert"
          className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <p className="text-muted text-sm leading-6">{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        </section>
      ) : entries.length === 0 ? (
        <section className="text-muted flex min-h-72 items-center justify-center px-6 text-center text-sm">
          아직 만들어진 스토리가 없어요.
        </section>
      ) : (
        <div className="px-5 pt-6">
          {story.days.map((day, dayIndex) => {
            const dayEntries = entries.filter((entry) => entry.day === day);
            if (dayEntries.length === 0) return null;
            return (
              <section
                key={`${day.date}-${dayIndex}`}
                aria-label={day.dayLabel ?? `${day.dayNumber}일째 ${day.placeName}`}
                className="relative pb-7 last:pb-0"
              >
                <div
                  aria-hidden="true"
                  className="absolute top-8 bottom-0 left-[19px] w-px bg-slate-200"
                />
                <h3 className="relative flex items-center gap-2.5 text-[13px] font-bold">
                  <span className="bg-brand rounded-lg px-2 py-1.5 text-xs font-semibold tabular-nums text-white">
                    {day.date.slice(5).replace('-', '.')}
                  </span>
                  {day.dayLabel ? (
                    <span className="min-w-0 truncate">{day.dayLabel}</span>
                  ) : (
                    <>
                      {DAY_LABELS[day.dayNumber - 1] ?? `${day.dayNumber}일째`}
                      <span className="text-muted min-w-0 truncate font-medium">
                        · {day.placeName}
                      </span>
                    </>
                  )}
                </h3>
                <ul className="mt-5 space-y-7">
                  {dayEntries.map(({ photo }) => (
                    <li key={photo.id} className="relative pl-10">
                      <span
                        aria-hidden="true"
                        className="absolute top-2 left-[14px] size-[11px] rounded-full border-2 border-slate-300 bg-white"
                      />
                      <p className="text-muted mb-2 inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold">
                        <span aria-hidden="true">⌖</span>
                        <span className="truncate">{getStoryPhotoLabel(photo)}</span>
                      </p>
                      <StoryPhotoCard photo={photo} onOpen={() => setActiveId(photo.id)} />
                      <p className="mt-2.5 text-[13px] font-medium leading-6">{photo.sentence}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      {active && (
        <StoryPhotoViewer
          photo={active.photo}
          day={active.day}
          current={activeIndex + 1}
          total={entries.length}
          onClose={() => setActiveId(null)}
          onPrevious={() =>
            setActiveId(entries[(activeIndex - 1 + entries.length) % entries.length].photo.id)
          }
          onNext={() => setActiveId(entries[(activeIndex + 1) % entries.length].photo.id)}
        />
      )}
    </main>
  );
}

function StoryPhotoCard({ photo, onOpen }: { photo: StoryPhoto; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  const unavailable = failed || !photo.thumbnailUrl;
  const canOpen = photo.attachmentId !== null;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!canOpen}
      aria-label={`${getStoryPhotoLabel(photo)} 사진 상세보기`}
      className={`focus-visible:outline-brand relative block aspect-square w-full overflow-hidden rounded-[18px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 ${canOpen ? 'cursor-pointer' : 'cursor-default'} ${unavailable ? 'border border-dashed border-slate-300 bg-surface-subtle' : 'bg-slate-100'}`}
    >
      {unavailable ? (
        <span className="text-muted flex h-full flex-col items-center justify-center gap-3 text-xs">
          <svg
            aria-hidden="true"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="m3 16 5-5 5 5 3-3 5 5M2 2l20 20" />
          </svg>
          사진을 불러오지 못했어요
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.thumbnailUrl!}
          alt={photo.sentence}
          width={320}
          height={320}
          loading="lazy"
          decoding="async"
          onError={() => {
            setFailed(true);
            toast.error('사진 로드에 실패했어요.');
          }}
          className="size-full object-cover"
        />
      )}
      {canOpen && (
        <span
          aria-hidden="true"
          className="absolute right-2.5 bottom-2.5 grid size-8 place-items-center rounded-lg bg-brand/75 text-white"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3h7v7M21 3l-8 8M10 21H3v-7M3 21l8-8" />
          </svg>
        </span>
      )}
    </button>
  );
}

function MetaIcon({ photo = false }: { photo?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {photo ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8" cy="9" r="1.5" />
          <path d="m3 17 6-6 4 4 3-3 5 5" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4m8-4v4M3 10h18" />
        </>
      )}
    </svg>
  );
}
