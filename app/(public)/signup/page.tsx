import { redirect } from 'next/navigation';

import { SignupPage } from '@/_pages/signup';
import { getCurrentUser } from '@/entities/user';

export default async function Page() {
  const session = await getCurrentUser();

  if (session.status === 'authenticated') {
    redirect('/');
  }

  return <SignupPage />;
}
