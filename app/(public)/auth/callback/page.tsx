import type { Metadata } from 'next';

import { AuthCallbackPage } from '@/_pages/authCallback';

export const metadata: Metadata = {
  title: '로그인 중 | 여담',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ loginTicket?: string | string[] }>;
}) {
  const { loginTicket } = await searchParams;

  return (
    <AuthCallbackPage loginTicket={Array.isArray(loginTicket) ? loginTicket[0] : loginTicket} />
  );
}
