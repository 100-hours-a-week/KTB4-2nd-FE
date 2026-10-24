import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { UnclassifiedPhotoListPage } from '@/_pages/unclassifiedPhotoList';
import { getTripDetail } from '@/features/tripDetail/api/getTripDetail';
import { parseUnclassifiedIssueSlug } from '@/features/unclassifiedPhotos';
import { parseRouteId } from '@/shared/lib/route';
import { getRenewRedirectPath, withSearchParams } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '미분류 사진 | 여담',
};

export default async function Page({
  params,
  searchParams,
}: PageProps<'/trips/[tripId]/unclassified/[issue]'>) {
  const { tripId: rawTripId, issue: rawIssue } = await params;
  const query = await searchParams;
  const tripId = parseRouteId(rawTripId);
  const issue = parseUnclassifiedIssueSlug(rawIssue);

  if (tripId === null) notFound();
  if (!issue) notFound();

  const result = await getTripDetail(tripId);

  if (result.status === 'unauthorized') {
    const next = withSearchParams(`/trips/${tripId}/unclassified/${rawIssue}`, query);
    redirect(getRenewRedirectPath(next, query.renewed));
  }

  if (result.status === 'notReady') redirect(`/trips/${tripId}/processing`);
  if (result.status !== 'ok') notFound();

  const tripName = typeof query.trip === 'string' ? query.trip : result.trip.name;

  return <UnclassifiedPhotoListPage tripId={tripId} tripName={tripName} issue={issue} />;
}
