import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { createPreviewTripDetail, TripDetailPage } from '@/_pages/tripDetail';
import { getCurrentUser } from '@/entities/user';

export const metadata: Metadata = {
  title: '여행 상세 | 여담',
};

export default async function Page({ params }: PageProps<'/trips/[tripId]'>) {
  const { tripId: rawTripId } = await params;
  const tripId = Number(rawTripId);

  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  if (process.env.NODE_ENV !== 'development') {
    const session = await getCurrentUser();

    if (session.status === 'unauthorized') {
      redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}`)}`);
    }

    if (session.status === 'notFound') redirect('/login');
  }

  // TODO: 여행 상세 조회 API가 준비되면 tripId로 데이터를 조회합니다.
  return <TripDetailPage trip={createPreviewTripDetail(tripId)} />;
}
