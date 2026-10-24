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
    <div role="status" aria-label="장소 사진 불러오는 중">
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="aspect-square w-full rounded-[14px]" />
            <Skeleton className="mt-2 h-3 w-16" />
            <Skeleton className="mt-1.5 h-2.5 w-9" />
          </div>
        ))}
      </div>
      {showError && (
        <div
          role="alert"
          className="bg-brand fixed right-5 bottom-[calc(var(--app-vertical-offset)+20px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto flex max-w-[390px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <WarningIcon stroke="#ffb1a9" size="17" />
          <span className="flex-1">사진 로드에 실패했어요.</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="cursor-pointer font-bold text-[#a9c8ff] hover:underline"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}
