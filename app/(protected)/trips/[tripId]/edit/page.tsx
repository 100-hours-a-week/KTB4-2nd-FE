import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { TripEditPage } from '@/_pages/tripEdit';
import { isTripCreateStep } from '@/features/createTrip';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { getRenewRedirectPath } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '여행 수정 | 여담',
};

export default async function Page({ params, searchParams }: PageProps<'/trips/[tripId]/edit'>) {
  const { tripId: rawTripId } = await params;
  const { step: queryStep, renewed } = await searchParams;
  const tripId = Number(rawTripId);
  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  const stepValue = Array.isArray(queryStep) ? queryStep[0] : queryStep;
  const initialStep = stepValue && isTripCreateStep(stepValue) ? stepValue : 'name';

  const result = await getTripDetail(tripId);
  if (result.status === 'unauthorized') {
    redirect(getRenewRedirectPath(`/trips/${tripId}/edit?step=${initialStep}`, renewed));
  }
  if (result.status === 'notReady') redirect('/trips');
  if (result.status !== 'ok') notFound();

  return <TripEditPage tripId={tripId} initialStep={initialStep} />;
}
