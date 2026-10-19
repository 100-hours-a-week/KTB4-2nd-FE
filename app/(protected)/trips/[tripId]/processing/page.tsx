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

  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') {
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/processing`)}`);
  }
  if (result.status === 'ok') redirect(`/trips/${tripId}`);
  if (result.status !== 'notReady') notFound();

  return <TripProcessingPage tripId={tripId} />;
}
