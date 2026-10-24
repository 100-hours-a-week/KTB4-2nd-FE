import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { StoryCreatePage } from '@/_pages/storyCreate';
import { getCurrentUser } from '@/entities/user';
import { isStoryCreateStep } from '@/features/createStory';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { parseRouteId } from '@/shared/lib/route';
import { getRenewRedirectPath } from '@/shared/lib/url';

export const metadata: Metadata = { title: '여행 스토리 만들기 | 여담' };

export default async function Page({
  params,
  searchParams,
}: PageProps<'/trips/[tripId]/story/create'>) {
  const { tripId: value } = await params;
  const { step: queryStep, renewed } = await searchParams;
  const tripId = parseRouteId(value);
  if (tripId === null) notFound();
  const stepValue = Array.isArray(queryStep) ? queryStep[0] : queryStep;
  const initialStep = isStoryCreateStep(stepValue) ? stepValue : 'mood';
  const returnTo = `/trips/${tripId}/story/create?step=${initialStep}`;
  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') redirect(getRenewRedirectPath(returnTo, renewed));
  if (result.status === 'notReady') redirect('/trips');
  if (result.status !== 'ok') notFound();
  if (result.trip.hasStory) redirect(`/trips/${tripId}/story`);
  const user = await getCurrentUser();
  if (user.status === 'unauthorized') redirect(getRenewRedirectPath(returnTo, renewed));
  if (user.status === 'notFound') redirect('/login');
  return (
    <StoryCreatePage
      trip={result.trip}
      nickname={user.status === 'authenticated' ? user.user.nickname : '회원'}
      initialStep={initialStep}
    />
  );
}
