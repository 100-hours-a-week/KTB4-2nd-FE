import { TripEditForm, type TripCreateStep } from '@/features/createTrip';

type TripEditPageProps = {
  tripId: number;
  initialStep: TripCreateStep;
};

export function TripEditPage({ tripId, initialStep }: TripEditPageProps) {
  return <TripEditForm tripId={tripId} initialStep={initialStep} />;
}
