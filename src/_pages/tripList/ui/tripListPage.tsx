'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  TripCard,
  toTripListSort,
  useTripFavorite,
  useTripList,
  type TripListFilter,
  type TripListItem,
  type TripSortOrder,
} from '@/features/tripList';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';
import { AlertCircleIcon, MapIcon } from '@/shared/ui/icons';
import { SelectDropdown } from '@/shared/ui/selectDropdown';
import { Skeleton } from '@/shared/ui/skeleton';

export type TripListPageProps = {
  onTripSelect?: (tripId: number) => void;
  initialFavoriteOnly?: boolean;
};

const navigationItems: BottomNavigationItem[] = [
  { id: 'home', label: '홈', icon: 'home', href: '/' },
  { id: 'list', label: '목록', icon: 'list', href: '/trips' },
  {
    id: 'create',
    label: '새 기록 추가',
    icon: 'plus',
    href: '/trips/create?step=name',
    action: true,
  },
  { id: 'search', label: '검색', icon: 'search', href: '/search' },
  { id: 'profile', label: '마이페이지', icon: 'profile', href: '/mypage' },
];

export function TripListPage({ onTripSelect, initialFavoriteOnly = false }: TripListPageProps) {
  const [sortOrder, setSortOrder] = useState<TripSortOrder>('newest');
  const [favoriteOnly, setFavoriteOnly] = useState(initialFavoriteOnly);

  const filter = useMemo<TripListFilter>(
    () => ({ sort: toTripListSort(sortOrder), favorite: favoriteOnly }),
    [favoriteOnly, sortOrder],
  );
  const { trips, viewState, refetch } = useTripList(filter);
  const { mutate: changeFavorite } = useTripFavorite(filter);
  const visibleTrips = favoriteOnly ? trips.filter((trip) => trip.favorite) : trips;
  const favoriteTrips = favoriteOnly ? visibleTrips : visibleTrips.filter((trip) => trip.favorite);
  const remainingTrips = favoriteOnly ? [] : visibleTrips.filter((trip) => !trip.favorite);

  function toggleFavorite(tripId: number) {
    const target = trips.find((trip) => trip.id === tripId);

    if (!target) return;

    changeFavorite({ tripId, favorite: !target.favorite });
  }

  return (
    <main className="text-brand bg-app-background relative mx-auto min-h-full w-full max-w-[430px] px-5 pt-[max(32px,env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))]">
      <header>
        <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em]">
          나의 여행 목록
        </h1>
        {viewState === 'loading' || viewState === 'error' ? (
          <Skeleton className="mt-2 h-3 w-44" />
        ) : (
          <p className="text-muted mt-1.5 text-xs">
            지금까지 <strong className="text-brand font-bold">{trips.length}개</strong>의 여행을
            기록했어요.
          </p>
        )}
      </header>

      {viewState === 'loading' || viewState === 'error' ? (
        <TripListSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
      ) : (
        <>
          {trips.length > 0 && (
            <TripListToolbar
              sortOrder={sortOrder}
              favoriteOnly={favoriteOnly}
              onSortChange={setSortOrder}
              onFavoriteOnlyChange={setFavoriteOnly}
            />
          )}
          {visibleTrips.length === 0 ? (
            <EmptyTripList favoriteOnly={favoriteOnly} />
          ) : (
            <div className="mt-4 space-y-5">
              {favoriteTrips.length > 0 && (
                <TripGroup
                  label="즐겨찾기한 여행"
                  trips={favoriteTrips}
                  onFavoriteChange={toggleFavorite}
                  onTripSelect={onTripSelect}
                />
              )}
              {remainingTrips.length > 0 && (
                <TripGroup
                  label={favoriteTrips.length > 0 ? '전체 여행' : undefined}
                  trips={remainingTrips}
                  onFavoriteChange={toggleFavorite}
                  onTripSelect={onTripSelect}
                />
              )}
            </div>
          )}
        </>
      )}
      <BottomNavigation items={navigationItems} activeId="list" />
    </main>
  );
}

function TripListToolbar({
  sortOrder,
  favoriteOnly,
  onSortChange,
  onFavoriteOnlyChange,
}: {
  sortOrder: TripSortOrder;
  favoriteOnly: boolean;
  onSortChange: (sortOrder: TripSortOrder) => void;
  onFavoriteOnlyChange: (checked: boolean) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <SelectDropdown
        label="여행 정렬"
        value={sortOrder}
        onChange={onSortChange}
        options={[
          { value: 'newest', label: '최신순' },
          { value: 'oldest', label: '오래된순' },
        ]}
      />
      <label className="flex min-h-9 cursor-pointer items-center gap-2 text-xs font-bold">
        <span>즐겨찾기만</span>
        <input
          type="checkbox"
          role="switch"
          aria-label="즐겨찾기만 보기"
          checked={favoriteOnly}
          onChange={(event) => onFavoriteOnlyChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="peer-checked:bg-brand peer-checked:[&>span]:translate-x-4 peer-focus-visible:ring-brand/50 relative h-6 w-10 rounded-full bg-slate-300 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
          <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow-sm transition-transform" />
        </span>
      </label>
    </div>
  );
}

function TripGroup({
  label,
  trips,
  onFavoriteChange,
  onTripSelect,
}: {
  label?: string;
  trips: TripListItem[];
  onFavoriteChange: (tripId: number) => void;
  onTripSelect?: (tripId: number) => void;
}) {
  return (
    <section aria-label={label ?? '여행'}>
      {label && <h2 className="text-muted mb-2 px-1 text-xs font-bold">{label}</h2>}
      <ul className="space-y-2.5">
        {trips.map((trip, index) => (
          <li key={trip.id}>
            <TripCard
              trip={trip}
              colorIndex={trip.id + index}
              onFavoriteChange={onFavoriteChange}
              onTripSelect={onTripSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyTripList({ favoriteOnly }: { favoriteOnly: boolean }) {
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

function TripListSkeleton({ showError, onRetry }: { showError: boolean; onRetry?: () => void }) {
  return (
    <section className="mt-4" aria-label="여행 목록 불러오는 중" role="status">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-border-subtle bg-surface flex min-h-[106px] rounded-[18px] border p-3"
          >
            <Skeleton className="h-[82px] w-[82px] shrink-0 rounded-[13px]" />
            <div className="flex-1 py-1 pl-3">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="mt-2.5 h-2.5 w-20" />
              <Skeleton className="mt-2.5 h-2.5 w-36" />
            </div>
          </div>
        ))}
      </div>
      {showError && (
        <div
          role="alert"
          className="bg-brand fixed right-5 bottom-[calc(var(--app-vertical-offset)+88px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto flex max-w-[390px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <AlertCircleIcon
            stroke="#ffb3a8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            size="18"
          />
          <span className="flex-1">여행을 가져오지 못했어요.</span>
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer font-bold text-[#a9c8ff] underline-offset-2 hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}
    </section>
  );
}
