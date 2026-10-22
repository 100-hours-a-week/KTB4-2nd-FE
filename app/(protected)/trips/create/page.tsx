import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { TripCreatePage } from '@/_pages/tripCreate';
import { getCurrentUser } from '@/entities/user';
import { isTripCreateStep } from '@/features/createTrip';

export const metadata: Metadata = {
  title: '여행 만들기 | 여담',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ step?: string | string[]; renewed?: string | string[] }>;
}) {
  const { step: queryStep, renewed } = await searchParams;
  const stepValue = Array.isArray(queryStep) ? queryStep[0] : queryStep;
  const initialStep = stepValue && isTripCreateStep(stepValue) ? stepValue : 'name';

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    if (renewed === '1') redirect('/login');

    const returnTo = `/trips/create?step=${initialStep}`;
    redirect(`/auth/renew?next=${encodeURIComponent(returnTo)}`);
  }

  if (session.status === 'notFound') redirect('/login');

  return <TripCreatePage initialStep={initialStep} />;
}
