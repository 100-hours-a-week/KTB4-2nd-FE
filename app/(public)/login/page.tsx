import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoginPage } from '@/_pages/login';
import { getCurrentUser } from '@/entities/user';

export const metadata: Metadata = {
  title: '로그인 | 여담',
};

export default async function Page() {
  const session = await getCurrentUser();

  if (session.status === 'authenticated') {
    redirect('/');
  }

  return <LoginPage />;
}
