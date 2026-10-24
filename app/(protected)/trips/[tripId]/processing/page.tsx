import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripProcessingPage } from '@/_pages/tripProcessing';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { parseRouteId } from '@/shared/lib/route';
import { getRenewRedirectPath } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '여행 만들기 | 여담',
};

export default async function Page({
  params,
  searchParams,
}: PageProps<'/trips/[tripId]/processing'>) {
  const { tripId: rawTripId } = await params;
  const { renewed } = await searchParams;
  const tripId = parseRouteId(rawTripId);
  if (tripId === null) notFound();

  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') {
    redirect(getRenewRedirectPath(`/trips/${tripId}/processing`, renewed));
  }
  if (result.status === 'ok') redirect(`/trips/${tripId}`);
  if (result.status !== 'notReady') notFound();

  return <TripProcessingPage tripId={tripId} />;
}
