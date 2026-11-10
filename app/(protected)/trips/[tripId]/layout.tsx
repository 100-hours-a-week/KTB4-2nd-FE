import { getCurrentUser } from '@/entities/user';
import { TripRealtimeSync } from '@/features/realtimeSync';
import { TripPresenceProvider } from '@/features/tripPresence';
import { parseRouteId } from '@/shared/lib/route';

export default async function Layout({ children, params }: LayoutProps<'/trips/[tripId]'>) {
  const tripId = parseRouteId((await params).tripId);
  if (tripId === null) return children;

  const currentUserId = await getCurrentUser()
    .then((current) => (current.status === 'authenticated' ? current.user.userId : null))
    .catch(() => null);

  return (
    <TripPresenceProvider tripId={tripId} currentUserId={currentUserId}>
      <TripRealtimeSync tripId={tripId} />
      {children}
    </TripPresenceProvider>
  );
}
