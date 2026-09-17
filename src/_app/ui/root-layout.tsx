import type { PropsWithChildren } from 'react';

import { AppProviders } from '../providers';
import { suit } from '../styles/fonts';
import '../styles/globals.css';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko" className={`${suit.variable} h-full antialiased`}>
      <body className="bg-app-background min-h-full overflow-x-hidden">
        <div className="bg-surface mx-auto min-h-dvh w-full max-w-107.5 overflow-x-hidden">
          <AppProviders>{children}</AppProviders>
        </div>
      </body>
    </html>
  );
}
