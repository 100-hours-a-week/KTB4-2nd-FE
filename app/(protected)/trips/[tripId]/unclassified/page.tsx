import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { UnclassifiedFolderPage } from '@/_pages/unclassifiedFolder';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { parseRouteId } from '@/shared/lib/route';
import { getRenewRedirectPath, withSearchParams } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '미분류 폴더 | 여담',
};

export default async function Page({
  params,
  searchParams,
}: PageProps<'/trips/[tripId]/unclassified'>) {
  const { tripId: rawTripId } = await params;
  const query = await searchParams;
  const tripId = parseRouteId(rawTripId);

  if (tripId === null) notFound();

  const result = await getTripDetail(tripId);

  if (result.status === 'unauthorized') {
    const next = withSearchParams(`/trips/${tripId}/unclassified`, query);
    redirect(getRenewRedirectPath(next, query.renewed));
  }

  if (result.status === 'notReady') redirect(`/trips/${tripId}/processing`);
  if (result.status !== 'ok') notFound();

  const tripName = typeof query.trip === 'string' ? query.trip : result.trip.name;

  return <UnclassifiedFolderPage tripId={tripId} tripName={tripName} />;
}
