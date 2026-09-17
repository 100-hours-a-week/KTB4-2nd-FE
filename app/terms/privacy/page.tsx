import type { Metadata } from 'next';

import { PrivacyPolicyPage } from '@/_pages/terms/privacy';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 여담',
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
