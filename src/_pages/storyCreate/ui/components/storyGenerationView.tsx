'use client';

import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/pageHeader';

export function StoryGenerationView({
  nickname,
  status,
  elapsed,
  progressPercent,
  message,
  onContinueElsewhere,
  onBack,
  onView,
  onRetry,
}: {
  nickname: string;
  status: 'processing' | 'completed' | 'failed';
  elapsed: number;
  progressPercent: number;
  message: string;
  onContinueElsewhere: () => void;
  onBack: () => void;
  onView: () => void;
  onRetry: () => void;
}) {
  const completed = status === 'completed';
  const failed = status === 'failed';
  return (
    <>
      <PageHeader onBack={onBack} backLabel="스토리 생성에서 돌아가기" className="shrink-0" />
      <div className="mt-10 shrink-0">
        <h1 className="text-[20px] leading-[1.4] font-extrabold tracking-[-0.04em]">
          {nickname}님의
          <br />
          {completed ? (
            <>
              스토리가 <span className="text-[#2d9475]">완성</span>됐어요!
            </>
          ) : (
            '여행 스토리를 생성하고 있어요'
          )}
        </h1>
        <p className="text-muted mt-4 text-[13px] leading-6">
          {completed ? (
            <>
              사진을 고르고 기록을 정리한
              <br />
              여행 스토리를 확인해 보세요.
            </>
          ) : (
            <>
              AI가 사진을 고르고, 이야기를 정리하고 있어요.
              <br />
              완성되면 바로 확인할 수 있어요.
            </>
          )}
        </p>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-label={completed ? '스토리 생성 완료' : failed ? '스토리 생성 실패' : '스토리 생성 중'}
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6"
      >
        <div className="relative size-[154px] shrink-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 160 160"
            className="absolute inset-0 size-full -rotate-90"
          >
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke={completed ? '#d7efe4' : '#edf1f6'}
              strokeWidth="6"
            />
            {!completed && !failed && (
              <circle
                cx="80"
                cy="80"
                r="72"
                fill="none"
                stroke="#021730"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="120 453"
                className="origin-center animate-spin motion-reduce:animate-none"
              />
            )}
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 72 72"
            className={`absolute top-1/2 left-1/2 size-[72px] -translate-x-1/2 -translate-y-1/2 ${failed ? 'text-slate-400' : 'text-brand'}`}
          >
            <rect x="7" y="7" width="26" height="26" rx="8" fill="currentColor" />
            <rect
              x="38"
              y="7"
              width="26"
              height="26"
              rx="8"
              fill={failed ? '#c4ceda' : '#2d9475'}
            />
            <path
              d="M7 45a8 8 0 0 1 8-8h10a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8H15l-8 7V45Z"
              fill="currentColor"
            />
            <rect x="38" y="37" width="26" height="26" rx="8" fill="currentColor" />
          </svg>
          {completed && (
            <span
              aria-hidden="true"
              className="absolute right-0 bottom-0 grid size-10 place-items-center rounded-full border-4 border-white bg-[#2d9475] text-xl font-bold text-white"
            >
              ✓
            </span>
          )}
        </div>
        {status === 'processing' && (
          <div className="w-full max-w-[240px] text-center">
            <p className="text-2xl font-extrabold tabular-nums">{progressPercent}%</p>
            <div
              role="progressbar"
              aria-label="스토리 생성 진행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className="bg-brand h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        {status === 'processing' && elapsed >= 60 && (
          <p className="rounded-full bg-amber-50 px-3 py-2 text-center text-[11px] font-semibold text-amber-700">
            예상보다 오래 걸리고 있어요. 조금만 기다려주세요.
          </p>
        )}
      </div>
      <footer className="shrink-0 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        {!failed && (
          <p className="text-muted mb-3 text-center text-xs font-semibold" aria-live="polite">
            {completed ? '스토리가 생성되었어요' : message}
          </p>
        )}
        {status === 'processing' && (
          <Button onClick={onContinueElsewhere} className="mb-3 w-full rounded-[16px] text-sm">
            다른 작업 이어하기
          </Button>
        )}
        <Button
          disabled={status === 'processing'}
          onClick={completed ? onView : onRetry}
          className="w-full rounded-[16px] text-sm disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100"
        >
          {completed
            ? '스토리 보기'
            : failed
              ? '다시 시도하기'
              : `스토리 생성 중... ${progressPercent}%`}
        </Button>
      </footer>
    </>
  );
}
