import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripEditPage } from '@/_pages/tripEdit';
import { isTripCreateStep } from '@/features/createTrip';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';

export const metadata: Metadata = {
  title: '여행 수정 | 여담',
};

export default async function Page({ params, searchParams }: PageProps<'/trips/[tripId]/edit'>) {
  const { tripId: rawTripId } = await params;
  const { step: queryStep } = await searchParams;
  const tripId = Number(rawTripId);
  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  const stepValue = Array.isArray(queryStep) ? queryStep[0] : queryStep;
  const initialStep = stepValue && isTripCreateStep(stepValue) ? stepValue : 'name';

  // 상세 조회로 로그인과 여행 접근 권한을 함께 확인합니다.
  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') {
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/edit?step=${initialStep}`)}`);
  }
  // 사진을 정리하는 중인 여행은 백엔드가 수정을 막으므로 들어오지 않게 합니다.
  if (result.status === 'notReady') redirect('/trips');
  if (result.status !== 'ok') notFound();

  return <TripEditPage tripId={tripId} initialStep={initialStep} />;
}
