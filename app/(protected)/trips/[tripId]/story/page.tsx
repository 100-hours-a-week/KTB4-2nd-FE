import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripStoryDetailPage } from '@/_pages/tripStory';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { getRenewRedirectPath } from '@/shared/lib/url';

export const metadata: Metadata = { title: '여행 스토리 | 여담' };

export default async function Page({ params, searchParams }: PageProps<'/trips/[tripId]/story'>) {
  const { tripId: value } = await params;
  const { renewed } = await searchParams;
  const tripId = Number(value);
  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') {
    redirect(getRenewRedirectPath(`/trips/${tripId}/story`, renewed));
  }
  if (result.status === 'notReady') redirect('/trips');
  if (result.status !== 'ok') notFound();

  return <TripStoryDetailPage trip={result.trip} />;
}
