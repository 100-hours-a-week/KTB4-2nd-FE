import { ProtectedLayout } from '@/_app/ui/accessLayouts';
import { getCurrentUser } from '@/entities/user';
import { StoryGenerationWatcher } from '@/features/createStory';
import { TripProcessingWatcher } from '@/features/createTrip';
import { RealtimeSync } from '@/features/realtimeSync';
import { AnalyticsIdentity } from '@/shared/lib/analytics';

export default async function Layout({ children }: { children: React.ReactNode }) {
  let userId: number | null = null;

  const analyticsEnabled =
    process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

  if (analyticsEnabled || process.env.NEXT_PUBLIC_REALTIME_EXPERIMENT === 'true') {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser.status === 'authenticated') userId = currentUser.user.userId;
    } catch {}
  }

  return (
    <ProtectedLayout>
      {analyticsEnabled && userId !== null && <AnalyticsIdentity userId={userId} />}
      <RealtimeSync userId={userId} />
      <StoryGenerationWatcher />
      <TripProcessingWatcher />
      {children}
    </ProtectedLayout>
  );
}
