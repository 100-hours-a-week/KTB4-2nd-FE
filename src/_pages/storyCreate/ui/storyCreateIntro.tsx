import { STORY_FOLDER_LIMIT, type StoryCreateStep } from '@/features/createStory/model/types';
import type { TripDetail } from '@/features/tripDetail';

export function StoryCreateIntro({
  trip,
  step,
  selectedCount,
}: {
  trip: TripDetail;
  step: StoryCreateStep;
  selectedCount: number;
}) {
  return (
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
            <strong className="text-brand">{selectedCount}</strong> / {STORY_FOLDER_LIMIT}
          </p>
        )}
      </div>
    </div>
  );
}
