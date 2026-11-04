import { Skeleton } from '@/shared/ui/skeleton';

/** TripCard와 같은 테두리·썸네일·글자 줄 위치를 가져 로딩 후 카드가 제자리에 나타납니다. */
export function TripCardSkeleton() {
  return (
    <div className="border-border-subtle bg-surface flex min-h-[106px] rounded-[18px] border p-3">
      <Skeleton animation="none" className="h-[82px] w-[82px] shrink-0 rounded-[13px]" />
      <div className="flex-1 py-1 pl-3">
        <Skeleton animation="none" className="h-3.5 w-28" />
        <Skeleton animation="none" className="mt-2.5 h-2.5 w-20" />
        <Skeleton animation="none" className="mt-2.5 h-2.5 w-36" />
      </div>
    </div>
  );
}
