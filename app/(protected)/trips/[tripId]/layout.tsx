import { TripRealtimeSync } from '@/features/realtimeSync';
import { parseRouteId } from '@/shared/lib/route';

export default async function Layout({ children, params }: LayoutProps<'/trips/[tripId]'>) {
  const tripId = parseRouteId((await params).tripId);

  return (
    <>
      {tripId !== null && <TripRealtimeSync tripId={tripId} />}
      {children}
    </>
  );
}
