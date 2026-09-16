import type { Metadata } from 'next';

import { RootLayout } from '@/_app';

export const metadata: Metadata = {
  title: '여담',
  description: '여행의 순간을 사진과 이야기로 기록하는 서비스',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return <RootLayout>{children}</RootLayout>;
}
