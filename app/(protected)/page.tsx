import { redirect } from 'next/navigation';

import { HomePage } from '@/_pages/home';
import { getCurrentUser } from '@/entities/user';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ renewed?: string | string[] }>;
}) {
  const { renewed } = await searchParams;

  // 백엔드 인증 연동 전에도 개발 중 화면을 확인할 수 있도록 개발 환경에서는 인증을 건너뜁니다.
  if (process.env.NODE_ENV === 'development') {
    return <HomePage />;
  }

  const session = await getCurrentUser();

  if (session.status === 'unauthorized') {
    // 갱신 직후에도 401이면 다시 갱신하지 않아 리다이렉트 루프를 막습니다.
    redirect(renewed === '1' ? '/login' : '/auth/renew');
  }

  if (session.status === 'notFound') {
    redirect('/login');
  }

  return <HomePage />;
}
