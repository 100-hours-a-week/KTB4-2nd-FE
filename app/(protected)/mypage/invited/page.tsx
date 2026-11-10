import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { InvitedTripsPage } from '@/_pages/invitedTrips';
import { getCurrentUser } from '@/entities/user';
import { getRenewRedirectPath } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '초대받은 폴더 | 여담',
};

export default async function Page({ searchParams }: PageProps<'/mypage/invited'>) {
  const { renewed } = await searchParams;
  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    redirect(getRenewRedirectPath('/mypage/invited', renewed));
  }
  if (session.status === 'notFound') redirect('/login');

  return <InvitedTripsPage />;
}
