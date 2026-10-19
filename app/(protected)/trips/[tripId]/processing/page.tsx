import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripProcessingPage } from '@/_pages/tripProcessing';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';

export const metadata: Metadata = {
  title: '여행 만들기 | 여담',
};

export default async function Page({ params }: PageProps<'/trips/[tripId]/processing'>) {
  const { tripId: rawTripId } = await params;
  const tripId = Number(rawTripId);
  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  // 상세 조회로 로그인과 여행 접근 권한을 함께 확인합니다. 정리 중인 여행은 409(notReady)로 옵니다.
  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') {
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/processing`)}`);
  }
  // 이미 정리가 끝난 여행이면 진행률 대신 상세로 보냅니다.
  if (result.status === 'ok') redirect(`/trips/${tripId}`);
  if (result.status !== 'notReady') notFound();

  return <TripProcessingPage tripId={tripId} />;
}
