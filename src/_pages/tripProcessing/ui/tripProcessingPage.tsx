import { TripProcessingProgress } from '@/features/createTrip';

type TripProcessingPageProps = {
  tripId: number;
};

export function TripProcessingPage({ tripId }: TripProcessingPageProps) {
  return <TripProcessingProgress tripId={tripId} />;
}
