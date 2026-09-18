import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AuthRenewPage } from '@/_pages/authRenew';

export default async function Page() {
  if (!(await cookies()).has('refreshToken')) {
    redirect('/login');
  }

  return <AuthRenewPage />;
}
