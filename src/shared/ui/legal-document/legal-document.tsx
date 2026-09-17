import type { PropsWithChildren } from 'react';

import { LegalBackButton } from './legal-back-button';

type LegalDocumentProps = PropsWithChildren<{
  title: string;
  effectiveDate: string;
}>;

export function LegalDocument({ title, effectiveDate, children }: LegalDocumentProps) {
  return (
    <main className="page-enter min-h-dvh px-6 pb-[max(40px,env(safe-area-inset-bottom))]">
      <header className="bg-surface/95 sticky top-0 z-10 -mx-2 flex h-16 items-center backdrop-blur-sm">
        <LegalBackButton />
      </header>

      <article className="pt-5">
        <h1 className="text-brand text-[28px] leading-tight font-bold tracking-[-0.02em]">
          {title}
        </h1>
        <p className="text-muted mt-3 text-sm">시행일: {effectiveDate}</p>

        <div
          className="text-field-border mt-10 space-y-10 text-[15px] leading-7
            [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-brand
            [&_li+li]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5
            [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-brand
            [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
        >
          {children}
        </div>
      </article>
    </main>
  );
}
