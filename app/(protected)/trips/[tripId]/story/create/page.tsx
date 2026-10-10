import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { StoryCreatePage } from '@/_pages/storyCreate';
import { getCurrentUser } from '@/entities/user';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';

export const metadata: Metadata = { title: '여행 스토리 만들기 | 여담' };

export default async function Page({ params }: PageProps<'/trips/[tripId]/story/create'>) {
  const { tripId: value } = await params;
  const tripId = Number(value);
  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();
  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized')
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/story/create`)}`);
  if (result.status === 'notReady') redirect('/trips');
  if (result.status !== 'ok') notFound();
  const user = await getCurrentUser();
  if (user.status === 'unauthorized')
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/story/create`)}`);
  return (
    <StoryCreatePage
      trip={result.trip}
      nickname={user.status === 'authenticated' ? user.user.nickname : '회원'}
    />
  );
}
