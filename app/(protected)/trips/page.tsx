import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { TripListPage } from '@/_pages/tripList';
import { getCurrentUser } from '@/entities/user';

export const metadata: Metadata = {
  title: '여행 목록 | 여담',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ renewed?: string | string[] }>;
}) {
  const { renewed } = await searchParams;

  if (process.env.NODE_ENV === 'development') {
    return <TripListPage />;
  }

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    redirect(renewed === '1' ? '/login' : '/auth/renew?next=%2Ftrips');
  }

  if (session.status === 'notFound') {
    redirect('/login');
  }

  return <TripListPage />;
}
