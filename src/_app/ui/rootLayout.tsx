import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import type { PropsWithChildren } from 'react';

import { AppProviders } from '../providers';
import { suit } from '../styles/fonts';
import '../styles/globals.css';

const GA_MEASUREMENT_ID = 'G-H7N5L6L033';
const CLARITY_PROJECT_ID = 'yrc7paa483';
const isProd = process.env.NODE_ENV === 'production';

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="ko" className={`${suit.variable} h-dvh overflow-hidden antialiased`}>
      <body className="bg-app-backdrop flex h-full items-center justify-center overflow-hidden">
        <div className="bg-surface h-[min(100dvh,var(--app-max-height))] w-full max-w-107.5 overflow-x-hidden overflow-y-auto shadow-[0_0_60px_rgba(2,23,48,0.14)]">
          <AppProviders>{children}</AppProviders>
        </div>
        {isProd && (
          <>
            <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
            <Script id="ms-clarity" strategy="afterInteractive">
              {`(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
