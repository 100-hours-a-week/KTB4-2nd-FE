import { TripUnavailablePage } from '@/_pages/tripUnavailable';
import { getCurrentUser } from '@/entities/user';

export default async function NotFound() {
  const email = await getCurrentUser()
    .then((current) => (current.status === 'authenticated' ? current.user.email : null))
    .catch(() => null);

  return <TripUnavailablePage email={email} />;
}
