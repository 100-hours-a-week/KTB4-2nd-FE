import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { PhotoListPage } from '@/_pages/photoList';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { parseRouteId } from '@/shared/lib/route';
import { getRenewRedirectPath, withSearchParams } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '사진 목록 | 여담',
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string; tripPlaceId: string }>;
  searchParams: Promise<{
    place?: string | string[];
    trip?: string | string[];
    renewed?: string | string[];
  }>;
}) {
  const { tripId: rawTripId, tripPlaceId: rawTripPlaceId } = await params;
  const query = await searchParams;
  const tripId = parseRouteId(rawTripId);
  const tripPlaceId = parseRouteId(rawTripPlaceId);

  if (tripId === null) notFound();
  if (tripPlaceId === null) notFound();

  const result = await getTripDetail(tripId);

  if (result.status === 'unauthorized') {
    const next = withSearchParams(`/trips/${tripId}/places/${tripPlaceId}/photos`, query);
    redirect(getRenewRedirectPath(next, query.renewed));
  }

  if (result.status === 'notReady') redirect(`/trips/${tripId}/processing`);
  if (result.status !== 'ok') notFound();

  const placeName = typeof query.place === 'string' ? query.place : '장소';
  const tripName = typeof query.trip === 'string' ? query.trip : result.trip.name;

  return (
    <PhotoListPage
      tripId={tripId}
      tripPlaceId={tripPlaceId}
      tripName={tripName}
      placeName={placeName}
    />
  );
}
