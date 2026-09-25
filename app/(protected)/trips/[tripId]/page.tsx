import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripDetailPage } from '@/_pages/tripDetail';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';

export const metadata: Metadata = {
  title: '여행 상세 | 여담',
};

export default async function Page({ params }: PageProps<'/trips/[tripId]'>) {
  const { tripId: rawTripId } = await params;
  const tripId = Number(rawTripId);

  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  // 상세 조회가 401을 돌려주므로 세션 확인을 따로 하지 않습니다.
  const result = await getTripDetail(tripId);

  if (result.status === 'ok') {
    return <TripDetailPage trip={result.trip} />;
  }

  if (result.status === 'unauthorized') {
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}`)}`);
  }

  // 사진 정리가 끝나지 않으면 상세를 볼 수 없어 목록으로 되돌립니다.
  if (result.status === 'notReady') redirect('/trips');

  notFound();
}
