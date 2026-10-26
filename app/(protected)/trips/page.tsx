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
  searchParams: Promise<{ renewed?: string | string[]; favorite?: string | string[] }>;
}) {
  const { renewed, favorite } = await searchParams;

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    const next = favorite === '1' ? '/trips?favorite=1' : '/trips';
    redirect(renewed === '1' ? '/login' : `/auth/renew?next=${encodeURIComponent(next)}`);
  }

  if (session.status === 'notFound') {
    redirect('/login');
  }

  return <TripListPage initialFavoriteOnly={favorite === '1'} />;
}
