import { ProtectedLayout } from '@/_app/ui/accessLayouts';
import { getCurrentUser } from '@/entities/user';
import { StoryGenerationWatcher } from '@/features/createStory';
import { TripProcessingWatcher } from '@/features/createTrip';
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
    } catch {}
  }

  return (
    <ProtectedLayout>
      {userId !== null && <AnalyticsIdentity userId={userId} />}
      <StoryGenerationWatcher />
      <TripProcessingWatcher />
      {children}
    </ProtectedLayout>
  );
}
