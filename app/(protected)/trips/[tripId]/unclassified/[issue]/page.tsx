import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { UnclassifiedPhotoListPage } from '@/_pages/unclassifiedPhotoList';
import { getCurrentUser } from '@/entities/user';
import { parseUnclassifiedIssueSlug } from '@/features/unclassifiedPhotos';

export const metadata: Metadata = {
  title: '미분류 사진 | 여담',
};

export default async function Page({
  params,
  searchParams,
}: PageProps<'/trips/[tripId]/unclassified/[issue]'>) {
  const { tripId: rawTripId, issue: rawIssue } = await params;
  const query = await searchParams;
  const tripId = Number(rawTripId);
  const issue = parseUnclassifiedIssueSlug(rawIssue);

  if (!Number.isSafeInteger(tripId) || tripId < 1) notFound();
  if (!issue) notFound();

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    redirect(`/auth/renew?next=${encodeURIComponent(`/trips/${tripId}/unclassified/${rawIssue}`)}`);
  }

  if (session.status === 'notFound') redirect('/login');

  const tripName = typeof query.trip === 'string' ? query.trip : '여행';

  return <UnclassifiedPhotoListPage tripId={tripId} tripName={tripName} issue={issue} />;
}
