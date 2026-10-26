import { formatStorage, getStorageUsagePercent, type UserStats } from '@/features/userStats';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

export function StorageCard({ stats }: { stats: UserStats | null }) {
  if (!stats) {
    return (
      <Card className="px-4 py-4" role="status" aria-label="저장 공간 불러오는 중">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-2 w-full rounded-full" />
        <Skeleton className="mt-2.5 h-3 w-40" />
      </Card>
    );
  }

  const percent = getStorageUsagePercent(stats.storageUsedBytes, stats.storageLimitBytes);
  const remaining = Math.max(0, stats.storageLimitBytes - stats.storageUsedBytes);
  const nearlyFull = percent >= 90;

  return (
    <Card as="section" aria-label="저장 공간" className="px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold tracking-[-0.01em]">저장 공간</h2>
        <p className="text-sm font-bold tabular-nums">
          {formatStorage(stats.storageUsedBytes)}
          <span className="text-muted font-medium">
            {' '}
            / {formatStorage(stats.storageLimitBytes)}
          </span>
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="저장 공간 사용량"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-3 h-2 overflow-hidden rounded-full bg-white"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${nearlyFull ? 'bg-danger' : 'bg-brand'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={`mt-2.5 text-xs ${nearlyFull ? 'text-danger font-semibold' : 'text-muted'}`}>
        {nearlyFull
          ? `저장 공간이 거의 찼어요. ${formatStorage(remaining)} 남았어요.`
          : `${percent}% 사용 중 · ${formatStorage(remaining)} 남았어요`}
      </p>
    </Card>
  );
}
