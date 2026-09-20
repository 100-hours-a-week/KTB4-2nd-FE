import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuthRenewPage } from '@/_pages/authRenew';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  if (!(await cookies()).has('refreshToken')) {
    redirect('/login');
  }

  const { next } = await searchParams;
  const requestedPath = Array.isArray(next) ? next[0] : next;
  const returnTo =
    requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';

  return <AuthRenewPage returnTo={returnTo} />;
}
