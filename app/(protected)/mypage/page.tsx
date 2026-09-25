import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MyPage } from '@/_pages/myPage';
import { getCurrentUser } from '@/entities/user';

export const metadata: Metadata = {
  title: '마이페이지 | 여담',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ renewed?: string | string[] }>;
}) {
  const { renewed } = await searchParams;

  // 프로필 조회만 실패한 경우에는 페이지를 버리지 않고 스켈레톤과 안내 토스트를 보여줍니다.
  let session;
  try {
    session = await getCurrentUser();
  } catch {
    return <MyPage user={null} />;
  }

  if (session.status === 'authenticated') {
    return (
      <MyPage
        user={{
          nickname: session.user.nickname,
          oauthConnected: session.user.oauthConnected,
          profileImageUrl: session.user.profileImageUrl,
        }}
      />
    );
  }

  if (session.status === 'unauthorized') {
    redirect(renewed === '1' ? '/login' : '/auth/renew?next=%2Fmypage');
  }

  redirect('/login');
}
