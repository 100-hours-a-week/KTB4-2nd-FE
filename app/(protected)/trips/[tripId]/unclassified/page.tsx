import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { UnclassifiedFolderPage } from '@/_pages/unclassifiedFolder';
import { getCurrentUser } from '@/entities/user';
import { withSearchParams } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '미분류 폴더 | 여담',
};

export default async function Page({
  params,
  searchParams,
}: PageProps<'/trips/[tripId]/unclassified'>) {
  const { tripId: rawTripId } = await params;
  const query = await searchParams;
  const tripId = Number(rawTripId);

  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    const next = withSearchParams(`/trips/${tripId}/unclassified`, query);
    redirect(`/auth/renew?next=${encodeURIComponent(next)}`);
  }

  if (session.status === 'notFound') redirect('/login');

  const tripName = typeof query.trip === 'string' ? query.trip : '여행';

  return <UnclassifiedFolderPage tripId={tripId} tripName={tripName} />;
}
