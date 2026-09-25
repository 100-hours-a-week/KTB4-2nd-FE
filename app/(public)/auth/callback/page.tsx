import type { Metadata } from 'next';

import { AuthCallbackPage } from '@/_pages/authCallback';

export const metadata: Metadata = {
  title: '로그인 중 | 여담',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    loginTicket?: string | string[];
    error?: string | string[];
  }>;
}) {
  const { loginTicket, error } = await searchParams;

  return (
    <AuthCallbackPage
      loginTicket={Array.isArray(loginTicket) ? loginTicket[0] : loginTicket}
      errorCode={Array.isArray(error) ? error[0] : error}
    />
  );
}
