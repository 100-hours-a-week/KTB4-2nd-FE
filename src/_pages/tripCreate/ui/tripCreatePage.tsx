import { TripCreateForm, type TripCreateStep } from '@/features/createTrip';

type TripCreatePageProps = {
  initialStep: TripCreateStep;
};

export function TripCreatePage({ initialStep }: TripCreatePageProps) {
  return <TripCreateForm initialStep={initialStep} />;
}
