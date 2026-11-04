import { RetryNotice } from '@/shared/ui/retryNotice';
import { WarningIcon } from '@/shared/ui/icons';
import { Skeleton } from '@/shared/ui/skeleton';

export function PlaceFolderSkeleton({
  showError,
  onRetry,
}: {
  showError: boolean;
  onRetry?: () => void;
}) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '장소 사진 불러오는 중'}
      aria-busy={!showError}
    >
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <Skeleton animation="none" className="aspect-square w-full rounded-[14px]" />
            <Skeleton animation="none" className="mt-2 h-3 w-16" />
            <Skeleton animation="none" className="mt-1.5 h-2.5 w-9" />
          </div>
        ))}
      </div>
      {showError && (
        <RetryNotice
          message="사진 로드에 실패했어요."
          onRetry={onRetry}
          icon={<WarningIcon stroke="#ffb1a9" size="17" />}
          className="fixed right-5 bottom-[calc(var(--app-vertical-offset,0px)+20px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto max-w-[390px]"
        />
      )}
    </div>
  );
}
