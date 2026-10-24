import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripDetailPage } from '@/_pages/tripDetail';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { parseRouteId } from '@/shared/lib/route';
import { getRenewRedirectPath } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '여행 상세 | 여담',
};

export default async function Page({ params, searchParams }: PageProps<'/trips/[tripId]'>) {
  const { tripId: rawTripId } = await params;
  const { renewed } = await searchParams;
  const tripId = parseRouteId(rawTripId);

  if (tripId === null) notFound();

  const result = await getTripDetail(tripId);

  if (result.status === 'ok') {
    return <TripDetailPage trip={result.trip} />;
  }

  if (result.status === 'unauthorized') {
    redirect(getRenewRedirectPath(`/trips/${tripId}`, renewed));
  }

  if (result.status === 'notReady') redirect(`/trips/${tripId}/processing`);

  notFound();
}
