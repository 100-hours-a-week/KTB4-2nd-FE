'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { TripEditForm, type TripCreateStep } from '@/features/createTrip';
import { useTripAccess } from '@/features/tripShare';
import { toast } from '@/shared/ui/toast';

type TripEditPageProps = {
  tripId: number;
  initialStep: TripCreateStep;
  currentUserId: number | null;
};

export function TripEditPage({ tripId, initialStep, currentUserId }: TripEditPageProps) {
  const router = useRouter();
  const { isChecking, isOwner, canEdit } = useTripAccess(tripId);
  const readOnly = !isChecking && !canEdit;

  useEffect(() => {
    if (!readOnly) return;

    toast.info('읽기 권한으로 공유받은 여행은 수정할 수 없어요.');
    router.replace(`/trips/${tripId}`);
  }, [readOnly, router, tripId]);

  if (readOnly) return null;

  return (
    <TripEditForm
      tripId={tripId}
      initialStep={initialStep}
      currentUserId={currentUserId}
      realtimeOnly={!isOwner}
    />
  );
}
