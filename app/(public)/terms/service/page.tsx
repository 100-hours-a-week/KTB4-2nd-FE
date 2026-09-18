import type { Metadata } from 'next';

import { ServiceTermsPage } from '@/_pages/terms/service';

export const metadata: Metadata = {
  title: '이용약관 | 여담',
};

export default function Page() {
  return <ServiceTermsPage />;
}
