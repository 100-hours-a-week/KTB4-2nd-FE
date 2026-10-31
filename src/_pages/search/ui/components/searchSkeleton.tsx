import { RetryNotice } from '@/shared/ui/retryNotice';
import { AlertCircleIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/skeleton';

export function SearchSkeleton({
  showError,
  errorMessage,
  onRetry,
}: {
  showError: boolean;
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '검색 중'}
      aria-busy={!showError}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="border-border-subtle bg-surface mt-4 shrink-0 rounded-[18px] border px-4 py-4">
        <Skeleton animation={showError ? 'none' : 'pulse'} className="h-3 w-24" />
        <Skeleton animation={showError ? 'none' : 'pulse'} className="mt-3 h-4 w-48" />
      </div>
      <div className="border-border-subtle mt-6 flex shrink-0 gap-5 border-b pb-3">
        <Skeleton animation={showError ? 'none' : 'pulse'} className="h-4 w-10" />
        <Skeleton animation={showError ? 'none' : 'pulse'} className="h-4 w-10" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mt-4 grid grid-cols-3 gap-1 pb-2">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton
              key={index}
              animation={showError ? 'none' : 'breathe'}
              delayMs={(index % 3) * 120 + Math.floor(index / 3) * 60}
              className="aspect-square w-full rounded-[5px]"
            />
          ))}
        </div>
      </div>
      {showError && (
        <RetryNotice
          message={errorMessage}
          onRetry={onRetry}
          icon={
            <AlertCircleIcon
              stroke="#ffb3a8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              size="18"
            />
          }
          className="fixed right-5 bottom-[calc(var(--app-vertical-offset,0px)+88px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto max-w-[390px]"
        />
      )}
    </div>
  );
}
