import { RetryNotice } from '@/shared/ui/retryNotice';
import { AlertCircleIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/skeleton';

export function TripListSkeleton({
  showError,
  onRetry,
}: {
  showError: boolean;
  onRetry?: () => void;
}) {
  return (
    <section
      className="mt-4"
      aria-label={showError ? undefined : '여행 목록 불러오는 중'}
      role={showError ? undefined : 'status'}
      aria-busy={!showError}
    >
      <div className="flex items-center justify-between">
        <Skeleton animation="none" className="h-9 w-20 rounded-full" />
        <Skeleton animation="none" className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-border-subtle bg-surface flex min-h-[106px] rounded-[18px] border p-3"
          >
            <Skeleton animation="none" className="h-[82px] w-[82px] shrink-0 rounded-[13px]" />
            <div className="flex-1 py-1 pl-3">
              <Skeleton animation="none" className="h-3.5 w-28" />
              <Skeleton animation="none" className="mt-2.5 h-2.5 w-20" />
              <Skeleton animation="none" className="mt-2.5 h-2.5 w-36" />
            </div>
          </div>
        ))}
      </div>
      {showError && (
        <RetryNotice
          message="여행을 가져오지 못했어요."
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
    </section>
  );
}
