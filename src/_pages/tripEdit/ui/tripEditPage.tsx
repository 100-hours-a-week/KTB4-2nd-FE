import { TripEditForm, type TripCreateStep } from '@/features/createTrip';

type TripEditPageProps = {
  tripId: number;
  initialStep: TripCreateStep;
  currentUserId: number | null;
};

export function TripEditPage({ tripId, initialStep, currentUserId }: TripEditPageProps) {
  return <TripEditForm tripId={tripId} initialStep={initialStep} currentUserId={currentUserId} />;
}
