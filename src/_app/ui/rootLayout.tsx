import type { PropsWithChildren } from 'react';

import { AppProviders } from '../providers';
import { suit } from '../styles/fonts';
import '../styles/globals.css';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko" className={`${suit.variable} h-dvh overflow-hidden antialiased`}>
      <body className="bg-app-background flex h-full items-center justify-center overflow-hidden">
        <div className="bg-surface h-[min(100dvh,var(--app-max-height))] w-full max-w-107.5 overflow-x-hidden overflow-y-auto">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
