'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { useRouter } from 'next/navigation';

import { TripCard, useTripFavorite, useTripList, type TripListFilter } from '@/features/tripList';
import { StarIcon } from '@/shared/ui/icons';
import { PageHeader } from '@/shared/ui/pageHeader';
import { Skeleton } from '@/shared/ui/skeleton';

const FAVORITE_FILTER: TripListFilter = { sort: 'LATEST', favorite: true };

export function FavoriteTripsPage() {
  const router = useRouter();
  const { trips, viewState, refetch } = useTripList(FAVORITE_FILTER);
  const { mutate: changeFavorite } = useTripFavorite(FAVORITE_FILTER);
  const favoriteTrips = trips.filter((trip) => trip.favorite);

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.replace('/mypage');
  }

  return (
    <main className="text-brand bg-app-background relative mx-auto min-h-full w-full max-w-[430px] px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader
        className="bg-app-background/95! -mx-5 min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] px-5 pt-[max(20px,env(safe-area-inset-top))]"
        title="즐겨찾기"
        onBack={handleBack}
        backLabel="마이페이지로 돌아가기"
      />

      {viewState === 'ready' && favoriteTrips.length > 0 && (
        <p className="text-muted mt-2 text-xs">
          <strong className="text-brand font-bold">{favoriteTrips.length}개</strong>의 여행
        </p>
      )}

      <section aria-label="즐겨찾기한 여행" className="mt-4">
        {viewState === 'ready' ? (
          favoriteTrips.length === 0 ? (
            <EmptyFavorites />
          ) : (
            <ul className="space-y-2.5">
              {favoriteTrips.map((trip, index) => (
                <li key={trip.id}>
                  <TripCard
                    trip={trip}
                    colorIndex={trip.id + index}
                    onFavoriteChange={(tripId) => changeFavorite({ tripId, favorite: false })}
                  />
                </li>
              ))}
            </ul>
          )
        ) : (
          <FavoritesSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
        )}
      </section>
    </main>
  );
}

function EmptyFavorites() {
  return (
    <div className="flex min-h-[56vh] flex-col items-center justify-center text-center">
      <span className="grid size-16 place-items-center rounded-full bg-[#fff6d6] text-[#f7b51d]">
        <StarIcon fill="currentColor" stroke="currentColor" size="28" />
      </span>
      <h2 className="mt-5 text-[15px] font-extrabold">즐겨찾기한 여행이 없어요</h2>
      <p className="text-muted mt-1 text-xs">
        여행 목록에서 별을 눌러 자주 보는 여행을 모아보세요.
      </p>
      <Link
        href="/trips"
        className="bg-brand hover:bg-brand-hover focus-visible:outline-brand mt-5 inline-flex min-h-10 items-center rounded-full px-5 text-sm font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        여행 목록 보기
      </Link>
    </div>
  );
}

function FavoritesSkeleton({ showError, onRetry }: { showError: boolean; onRetry: () => void }) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '즐겨찾기 불러오는 중'}
    >
      <div className="space-y-2.5">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton animation="none" key={index} className="h-[106px] w-full rounded-[18px]" />
        ))}
      </div>
      {showError && (
        <div role="alert" className="mt-6 text-center">
          <p className="text-muted text-xs">즐겨찾기를 불러오지 못했어요.</p>
          <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
            다시 시도
          </Button>
        </div>
      )}
    </div>
  );
}
