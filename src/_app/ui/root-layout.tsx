import type { PropsWithChildren } from 'react';

import { AppProviders } from '../providers';
import '../styles/globals.css';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
