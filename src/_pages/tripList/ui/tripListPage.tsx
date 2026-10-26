'use client';

import { useMemo, useState } from 'react';

import {
  toTripListSort,
  useTripFavorite,
  useTripList,
  type TripListFilter,
  type TripSortOrder,
} from '@/features/tripList';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';
import { Skeleton } from '@/shared/ui/skeleton';

import { TripListToolbar } from './components/tripListToolbar';
import { TripGroup } from './components/tripGroup';
import { EmptyTripList } from './components/emptyTripList';
import { TripListSkeleton } from './components/tripListSkeleton';

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
          <Skeleton animation="none" className="mt-2 h-3 w-44" />
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
