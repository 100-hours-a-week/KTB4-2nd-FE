import Link from 'next/link';

import type { TripDetail } from '@/features/tripDetail';
import { ImageIcon } from '@/shared/ui/icons';

export function EmptyPlaceFolders({
  trip,
  hasPhotos,
  isCounting,
}: {
  trip: TripDetail;
  hasPhotos: boolean;
  isCounting: boolean;
}) {
  if (isCounting) return <div className="min-h-[280px]" aria-busy="true" />;

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-3 py-10 text-center">
      <span className="text-muted grid size-16 place-items-center rounded-full bg-slate-100 [&>svg]:size-7">
        <ImageIcon size="13" />
      </span>
      <h2 className="mt-4 text-[15px] font-extrabold">
        {hasPhotos ? '장소를 찾은 사진이 없어요' : '아직 사진이 없어요'}
      </h2>
      <p className="text-muted mt-1.5 text-xs leading-5">
        {hasPhotos ? (
          <>
            위치 정보가 없는 사진은 미분류에 모아뒀어요.
            <br />
            미분류에서 원하는 장소로 옮길 수 있어요.
          </>
        ) : (
          '여행 수정에서 사진을 추가해 보세요.'
        )}
      </p>
      <Link
        href={
          hasPhotos
            ? `/trips/${trip.id}/unclassified?trip=${encodeURIComponent(trip.name)}`
            : `/trips/${trip.id}/edit?step=images`
        }
        className="bg-brand hover:bg-brand-hover focus-visible:outline-brand mt-5 inline-flex min-h-10 items-center rounded-full px-4 text-xs font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {hasPhotos ? '미분류 사진 보기' : '사진 추가하기'}
      </Link>
    </div>
  );
}
