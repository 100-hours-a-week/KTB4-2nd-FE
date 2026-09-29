import type { PropsWithChildren } from 'react';

import { AppProviders } from '../providers';
import { suit } from '../styles/fonts';
import '../styles/globals.css';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko" className={`${suit.variable} h-dvh overflow-hidden antialiased`}>
      <body className="bg-app-backdrop flex h-full items-center justify-center overflow-hidden">
        <div className="bg-surface h-[min(100dvh,var(--app-max-height))] w-full max-w-107.5 overflow-x-hidden overflow-y-auto shadow-[0_0_60px_rgba(2,23,48,0.14)]">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
