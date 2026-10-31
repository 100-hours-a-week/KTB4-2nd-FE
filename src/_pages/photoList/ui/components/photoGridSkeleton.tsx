import { RetryNotice } from '@/shared/ui/retryNotice';

const TILE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect rx="5" fill="#e2e8f0" style="width:calc(100% - 4px);height:calc(100% - 4px)"/></svg>',
)}")`;

export function PhotoGridSkeletonTiles({ count = 18 }: { count?: number }) {
  const rows = Math.ceil(count / 3);
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundImage: TILE,
        backgroundRepeat: 'repeat',
        backgroundSize: 'calc((100% + 4px) / 3) auto',
        paddingBottom: `calc((100% + 4px) / 3 * ${rows} - 4px)`,
      }}
    />
  );
}

export function PhotoGridSkeleton({
  showError,
  onRetry,
}: {
  showError: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '사진 불러오는 중'}
      aria-busy={!showError}
    >
      <div className="mt-3">
        <PhotoGridSkeletonTiles />
      </div>
      {showError && (
        <RetryNotice
          message="사진을 가져오지 못했어요."
          onRetry={onRetry}
          className="fixed right-4 bottom-[calc(var(--app-vertical-offset,0px)+20px+env(safe-area-inset-bottom))] left-4 z-30 mx-auto max-w-[398px]"
        />
      )}
    </div>
  );
}
