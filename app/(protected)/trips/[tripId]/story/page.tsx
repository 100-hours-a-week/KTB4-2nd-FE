import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripStoryDetailPage } from '@/_pages/tripStory';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';

export const metadata: Metadata = { title: '여행 스토리 | 여담' };

export default async function Page({ params }: PageProps<'/trips/[tripId]/story'>) {
  const { tripId: value } = await params;
  const tripId = Number(value);
  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') {
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/story`)}`);
  }
  if (result.status === 'notReady') redirect('/trips');
  if (result.status !== 'ok') notFound();

  return <TripStoryDetailPage trip={result.trip} />;
}
