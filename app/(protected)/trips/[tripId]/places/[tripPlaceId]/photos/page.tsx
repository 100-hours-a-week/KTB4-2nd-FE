import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { createPreviewPhotos, PhotoListPage } from '@/_pages/photoList';
import { getCurrentUser } from '@/entities/user';

export const metadata: Metadata = {
  title: '사진 목록 | 여담',
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string; tripPlaceId: string }>;
  searchParams: Promise<{ place?: string | string[]; trip?: string | string[] }>;
}) {
  const { tripId: rawTripId, tripPlaceId: rawTripPlaceId } = await params;
  const query = await searchParams;
  const tripId = Number(rawTripId);
  const tripPlaceId = Number(rawTripPlaceId);

  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();
  if (!Number.isSafeInteger(tripPlaceId) || tripPlaceId < 1) notFound();

  if (process.env.NODE_ENV !== 'development') {
    const session = await getCurrentUser();
    if (session.status === 'unauthorized') {
      redirect(
        `/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/places/${tripPlaceId}/photos`)}`,
      );
    }
    if (session.status === 'notFound') redirect('/login');
  }

  const placeName = typeof query.place === 'string' ? query.place : '제주시';
  const tripName = typeof query.trip === 'string' ? query.trip : '제주도 가을 여행';

  return (
    <PhotoListPage
      tripId={tripId}
      tripName={tripName}
      placeName={placeName}
      initialPhotos={createPreviewPhotos()}
    />
  );
}
