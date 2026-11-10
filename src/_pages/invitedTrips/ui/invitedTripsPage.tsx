'use client';

import { useRouter } from 'next/navigation';

import { TripCard, TripCardSkeleton, useInvitedTrips } from '@/features/tripList';
import type { TripSharePermission } from '@/features/tripShare';
import { AlertCircleIcon, LinkIcon } from '@/shared/ui/icons';
import { PageHeader } from '@/shared/ui/pageHeader';
import { RetryNotice } from '@/shared/ui/retryNotice';
import { Skeleton } from '@/shared/ui/skeleton';

const PERMISSION_LABEL: Record<TripSharePermission, string> = {
  READ: '읽기 허용',
  WRITE: '편집 허용',
};

export function InvitedTripsPage() {
  const router = useRouter();
  const { trips, totalCount, viewState, refetch } = useInvitedTrips();

  function handleBack() {
    if (window.history.length > 1) router.back();
    else router.replace('/mypage');
  }

  return (
    <main className="text-brand bg-app-background relative mx-auto min-h-full w-full max-w-[430px] px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader
        className="bg-app-background/95! -mx-5 min-h-[calc(48px+max(20px,env(safe-area-inset-top)))] px-5 pt-[max(20px,env(safe-area-inset-top))]"
        title="초대받은 폴더"
        onBack={handleBack}
        backLabel="마이페이지로 돌아가기"
      />

      {viewState === 'ready' && trips.length > 0 && (
        <p className="text-muted mt-2 text-xs">
          <strong className="text-brand font-bold">{totalCount}개</strong>의 여행
        </p>
      )}
      {viewState !== 'ready' && <Skeleton animation="none" className="mt-2.5 h-3 w-16" />}

      <section aria-label="초대받은 여행" className="mt-4">
        {viewState === 'ready' ? (
          trips.length === 0 ? (
            <EmptyInvitedTrips />
          ) : (
            <ul className="space-y-2.5">
              {trips.map((trip, index) => (
                <li key={trip.id}>
                  <TripCard
                    trip={trip}
                    colorIndex={trip.id + index}
                    badge={PERMISSION_LABEL[trip.permission]}
                  />
                </li>
              ))}
            </ul>
          )
        ) : (
          <InvitedTripsSkeleton showError={viewState === 'error'} onRetry={() => void refetch()} />
        )}
      </section>
    </main>
  );
}

function EmptyInvitedTrips() {
  return (
    <div className="flex min-h-[56vh] flex-col items-center justify-center text-center">
      <span className="bg-surface-subtle text-brand grid size-16 place-items-center rounded-full">
        <LinkIcon size="28" />
      </span>
      <h2 className="mt-5 text-[15px] font-extrabold">초대받은 여행이 없어요</h2>
      <p className="text-muted mt-1 text-xs">다른 사람이 여행을 공유하면 여기에서 볼 수 있어요.</p>
    </div>
  );
}

function InvitedTripsSkeleton({ showError, onRetry }: { showError: boolean; onRetry: () => void }) {
  return (
    <div
      role={showError ? undefined : 'status'}
      aria-label={showError ? undefined : '초대받은 여행 불러오는 중'}
      aria-busy={!showError}
    >
      <ul className="space-y-2.5">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index}>
            <TripCardSkeleton />
          </li>
        ))}
      </ul>
      {showError && (
        <RetryNotice
          message="초대받은 여행을 불러오지 못했어요."
          onRetry={onRetry}
          icon={<AlertCircleIcon stroke="#ffb3a8" strokeWidth="2" size="18" />}
          className="fixed right-5 bottom-[calc(var(--app-vertical-offset,0px)+20px+env(safe-area-inset-bottom))] left-5 z-30 mx-auto max-w-[390px]"
        />
      )}
    </div>
  );
}
