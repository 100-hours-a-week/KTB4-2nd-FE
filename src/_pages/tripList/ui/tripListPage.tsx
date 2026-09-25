'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  toTripListSort,
  useTripFavorite,
  useTripList,
  type TripListFilter,
  type TripListItem,
  type TripSortOrder,
} from '@/features/tripList';
import { BottomNavigation, type BottomNavigationItem } from '@/shared/ui/bottomNavigation';
import { SelectDropdown } from '@/shared/ui/selectDropdown';
import { Skeleton } from '@/shared/ui/skeleton';

export type TripListPageProps = {
  onTripSelect?: (tripId: number) => void;
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
  { id: 'search', label: '검색', icon: 'search', disabled: true },
  { id: 'profile', label: '마이페이지', icon: 'profile', href: '/mypage' },
];

export function TripListPage({ onTripSelect }: TripListPageProps) {
  const [sortOrder, setSortOrder] = useState<TripSortOrder>('newest');
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const filter = useMemo<TripListFilter>(
    () => ({ sort: toTripListSort(sortOrder), favorite: favoriteOnly }),
    [favoriteOnly, sortOrder],
  );
  const { trips, viewState, refetch } = useTripList(filter);
  const { mutate: changeFavorite } = useTripFavorite(filter);

  // 정렬은 목록 API의 sort 파라미터가 처리하므로 응답 순서를 그대로 유지합니다.
  const visibleTrips = favoriteOnly ? trips.filter((trip) => trip.favorite) : trips;
  const favoriteTrips = favoriteOnly ? visibleTrips : visibleTrips.filter((trip) => trip.favorite);
  const remainingTrips = favoriteOnly ? [] : visibleTrips.filter((trip) => !trip.favorite);

  function toggleFavorite(tripId: number) {
    const target = trips.find((trip) => trip.id === tripId);

    if (!target) return;

    changeFavorite({ tripId, favorite: !target.favorite });
  }

  return (
    <main className="text-brand bg-app-background relative mx-auto min-h-dvh w-full max-w-[430px] px-5 pt-[max(32px,env(safe-area-inset-top))] pb-[calc(100px+env(safe-area-inset-bottom))]">
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

function TripCard({
  trip,
  colorIndex,
  onFavoriteChange,
  onTripSelect,
}: {
  trip: TripListItem;
  colorIndex: number;
  onFavoriteChange: (tripId: number) => void;
  onTripSelect?: (tripId: number) => void;
}) {
  return (
    <article className="border-border-subtle bg-surface relative flex min-h-[106px] overflow-hidden rounded-[18px] border p-3 shadow-[0_2px_8px_rgba(2,23,48,0.03)] transition-transform active:scale-[0.99]">
      <button
        type="button"
        aria-label={`${trip.name} 여행 상세 보기`}
        onClick={() => onTripSelect?.(trip.id)}
        className="absolute inset-0 cursor-pointer rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
      />
      <TripThumbnail trip={trip} colorIndex={colorIndex} />
      <div className="pointer-events-none z-10 min-w-0 flex-1 py-0.5 pl-3 pr-7">
        <h3 className="truncate text-sm font-extrabold tracking-[-0.01em]">{trip.name}</h3>
        <p className="text-muted mt-1 truncate text-[11px]">
          {trip.locations.slice(0, 3).join(', ')}
        </p>
        <p className="text-muted mt-1 truncate text-[11px]">
          {formatShortDate(trip.startDate)} - {formatShortDate(trip.endDate)} · {trip.nights}박
        </p>
        {trip.processingStatus === 'processing' ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#3973b9]">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[#3973b9]" />
            여담이 사진을 정리하고 있어요
          </p>
        ) : (
          <p className="text-muted mt-1 flex items-center gap-1 text-[11px]">
            <PhotoIcon /> 사진 {trip.photoCount}장
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`${trip.name} ${trip.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}`}
        aria-pressed={trip.favorite}
        onClick={() => onFavoriteChange(trip.id)}
        className="focus-visible:outline-brand absolute top-3 right-3 z-20 grid size-7 cursor-pointer place-items-center rounded-full focus-visible:outline-2"
      >
        <StarIcon filled={trip.favorite} />
      </button>
    </article>
  );
}

function TripThumbnail({ trip, colorIndex }: { trip: TripListItem; colorIndex: number }) {
  if (trip.thumbnailUrl) {
    return (
      <div
        aria-hidden="true"
        className="h-[82px] w-[82px] shrink-0 rounded-[13px] bg-cover bg-center"
        style={{ backgroundImage: `url(${JSON.stringify(trip.thumbnailUrl)})` }}
      />
    );
  }
  if (trip.processingStatus === 'processing') {
    return (
      <div className="grid h-[82px] w-[82px] shrink-0 place-items-center rounded-[13px] bg-slate-100">
        <span
          aria-label="사진 정리 중"
          role="status"
          className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand"
        />
      </div>
    );
  }
  const gradients = [
    'from-[#273a63] via-[#4d638c] to-[#172743]',
    'from-[#f3d5a2] via-[#d87743] to-[#9d3f25]',
    'from-[#cfe5ed] via-[#8ebaa6] to-[#528b9e]',
  ];
  return (
    <div
      aria-hidden="true"
      className={`relative h-[82px] w-[82px] shrink-0 overflow-hidden rounded-[13px] bg-gradient-to-br ${gradients[colorIndex % gradients.length]}`}
    >
      <span className="absolute right-[-10px] bottom-[-18px] size-16 rounded-full bg-white/20" />
      <span className="absolute bottom-3 left-3 h-1.5 w-12 rounded-full bg-white/30" />
    </div>
  );
}

function EmptyTripList({ favoriteOnly }: { favoriteOnly: boolean }) {
  return (
    <section className="flex min-h-[58vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-slate-200/55 text-slate-500">
        <MapIcon />
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
          className="bg-brand fixed right-5 bottom-[calc(88px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto flex max-w-[390px] items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold text-white shadow-lg"
        >
          <ErrorIcon />
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

function formatShortDate(date: string) {
  return date.slice(2).replaceAll('-', '.');
}

function PhotoIcon() {
  return (
    <svg
      aria-hidden="true"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </svg>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? '#f7b51d' : 'none'}
      stroke={filled ? '#f7b51d' : '#a5b0be'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5Z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      aria-hidden="true"
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffb3a8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" />
    </svg>
  );
}
