import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { PhotoListPage } from '@/_pages/photoList';
import { getCurrentUser } from '@/entities/user';
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
  const tripId = Number(rawTripId);
  const tripPlaceId = Number(rawTripPlaceId);

  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();
  if (!Number.isSafeInteger(tripPlaceId) || tripPlaceId < 1) notFound();

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    const next = withSearchParams(`/trips/${tripId}/places/${tripPlaceId}/photos`, query);
    redirect(getRenewRedirectPath(next, query.renewed));
  }

  if (session.status === 'notFound') redirect('/login');

  const placeName = typeof query.place === 'string' ? query.place : '장소';
  const tripName = typeof query.trip === 'string' ? query.trip : '여행';

  return (
    <PhotoListPage
      tripId={tripId}
      tripPlaceId={tripPlaceId}
      tripName={tripName}
      placeName={placeName}
    />
  );
}
