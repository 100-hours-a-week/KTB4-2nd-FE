import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SearchPage } from '@/_pages/search';
import { getCurrentUser } from '@/entities/user';
import { normalizeSearchQuery } from '@/features/search';

export const metadata: Metadata = {
  title: '검색 | 여담',
};

export default async function Page({ searchParams }: PageProps<'/search'>) {
  const { q, renewed } = await searchParams;
  const query = typeof q === 'string' ? normalizeSearchQuery(q) : '';

  if (process.env.NODE_ENV === 'development') {
    return <SearchPage query={query} />;
  }

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    const next = query ? `/search?q=${encodeURIComponent(query)}` : '/search';
    redirect(renewed === '1' ? '/login' : `/auth/renew?next=${encodeURIComponent(next)}`);
  }

  if (session.status === 'notFound') {
    redirect('/login');
  }

  return <SearchPage query={query} />;
}
