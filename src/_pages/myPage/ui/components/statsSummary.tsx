import type { UserStats } from '@/features/userStats';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

const numberFormat = new Intl.NumberFormat('ko-KR');

export function StatsSummary({ stats }: { stats: UserStats | null }) {
  const items = [
    { label: '여행', value: stats?.tripCount },
    { label: '사진', value: stats?.photoCount },
    { label: '스토리', value: stats?.storyCount },
  ];

  return (
    <Card
      as="dl"
      aria-label="내 기록"
      className="grid grid-cols-3 divide-x divide-[color-mix(in_srgb,var(--border-subtle)_80%,transparent)] py-4"
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1">
          <dt className="text-muted order-2 text-xs font-medium">{item.label}</dt>
          <dd className="order-1 text-[22px] leading-7 font-extrabold tracking-[-0.02em] tabular-nums">
            {item.value === undefined ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              numberFormat.format(item.value)
            )}
          </dd>
        </div>
      ))}
    </Card>
  );
}
