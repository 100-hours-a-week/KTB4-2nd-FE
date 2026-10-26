import Link from 'next/link';

import { MapIcon } from '@/shared/ui/icons';

export function EmptyTripList({ favoriteOnly }: { favoriteOnly: boolean }) {
  return (
    <section className="flex min-h-[58vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-slate-200/55 text-slate-500">
        <MapIcon strokeLinecap="round" strokeLinejoin="round" size="30" />
      </span>
      <h2 className="mt-5 text-[15px] font-extrabold">
        {favoriteOnly ? '즐겨찾기한 여행이 없어요.' : '아직 기록된 여행이 없어요.'}
      </h2>
      <p className="text-muted mt-1 text-xs">
        {favoriteOnly ? '마음에 드는 여행에 별을 눌러보세요!' : '여행을 만들고 사진을 올려보세요!'}
      </p>
      {!favoriteOnly && (
        <Link
          href="/trips/create?step=name"
          className="bg-brand hover:bg-brand-hover focus-visible:outline-brand mt-5 inline-flex min-h-11 items-center gap-1 rounded-full px-5 text-sm font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span aria-hidden="true">＋</span> 첫 여행 만들기
        </Link>
      )}
    </section>
  );
}
