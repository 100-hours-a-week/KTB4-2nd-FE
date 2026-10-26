import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { FavoriteTripsPage } from '@/_pages/favoriteTrips';
import { getCurrentUser } from '@/entities/user';
import { getRenewRedirectPath } from '@/shared/lib/url';

export const metadata: Metadata = {
  title: '즐겨찾기 | 여담',
};

export default async function Page({ searchParams }: PageProps<'/mypage/favorites'>) {
  const { renewed } = await searchParams;
  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    redirect(getRenewRedirectPath('/mypage/favorites', renewed));
  }
  if (session.status === 'notFound') redirect('/login');

  return <FavoriteTripsPage />;
}
