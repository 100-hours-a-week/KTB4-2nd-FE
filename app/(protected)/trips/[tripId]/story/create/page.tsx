import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { StoryCreatePage } from '@/_pages/storyCreate';
import { getCurrentUser } from '@/entities/user';
import { isStoryCreateStep } from '@/features/createStory';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';

export const metadata: Metadata = { title: '여행 스토리 만들기 | 여담' };

export default async function Page({
  params,
  searchParams,
}: PageProps<'/trips/[tripId]/story/create'>) {
  const { tripId: value } = await params;
  const { step: queryStep } = await searchParams;
  const tripId = Number(value);
  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();
  const stepValue = Array.isArray(queryStep) ? queryStep[0] : queryStep;
  const initialStep = isStoryCreateStep(stepValue) ? stepValue : 'mood';
  const returnTo = `/trips/${tripId}/story/create?step=${initialStep}`;
  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized')
    redirect(`/auth/renew?next=${encodeURIComponent(returnTo)}`);
  if (result.status === 'notReady') redirect('/trips');
  if (result.status !== 'ok') notFound();
  if (result.trip.hasStory) redirect(`/trips/${tripId}/story`);
  const user = await getCurrentUser();
  if (user.status === 'unauthorized') redirect(`/auth/renew?next=${encodeURIComponent(returnTo)}`);
  return (
    <StoryCreatePage
      trip={result.trip}
      nickname={user.status === 'authenticated' ? user.user.nickname : '회원'}
      initialStep={initialStep}
    />
  );
}
