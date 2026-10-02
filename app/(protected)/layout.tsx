import { ProtectedLayout } from '@/_app/ui/accessLayouts';
import { getCurrentUser } from '@/entities/user';
import { AnalyticsIdentity } from '@/shared/lib/analytics';

export default async function Layout({ children }: { children: React.ReactNode }) {
  let userId: number | null = null;

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true'
  ) {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser.status === 'authenticated') userId = currentUser.user.userId;
    } catch {
      // 분석 식별 실패가 화면 렌더링이나 기존 인증 흐름을 막지 않게 합니다.
    }
  }

  return (
    <ProtectedLayout>
      {userId !== null && <AnalyticsIdentity userId={userId} />}
      {children}
    </ProtectedLayout>
  );
}
