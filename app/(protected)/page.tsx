import { redirect } from 'next/navigation';

import { HomePage } from '@/_pages/home';
import { getCurrentUser } from '@/entities/user';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ renewed?: string | string[] }>;
}) {
  const [{ renewed }, session] = await Promise.all([searchParams, getCurrentUser()]);

  if (session.status === 'unauthorized') {
    // 갱신 직후에도 401이면 다시 갱신하지 않아 리다이렉트 루프를 막습니다.
    redirect(renewed === '1' ? '/login' : '/auth/renew');
  }

  if (session.status === 'notFound') {
    redirect('/login');
  }

  return <HomePage />;
}
