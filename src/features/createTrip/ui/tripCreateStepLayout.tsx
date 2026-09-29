import type { ReactNode } from 'react';

import { PageHeader } from '@/shared/ui/pageHeader';

type TripCreateStepLayoutProps = {
  title: ReactNode;
  description?: string;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
  fixedFooter?: boolean;
  contentScrollable?: boolean;
};

export function TripCreateStepLayout({
  title,
  description,
  onBack,
  children,
  footer,
  fixedFooter = false,
  contentScrollable = true,
}: TripCreateStepLayoutProps) {
  return (
    <main
      className={`bg-surface mx-auto flex h-full min-h-0 w-full max-w-107.5 flex-col overflow-hidden px-5 pt-[max(20px,env(safe-area-inset-top))] text-foreground ${fixedFooter ? 'pb-[calc(92px+env(safe-area-inset-bottom))]' : 'pb-[max(20px,env(safe-area-inset-bottom))]'}`}
    >
      <PageHeader backLabel="이전 단계로 이동" onBack={onBack} />

      <header className="mt-8 shrink-0">
        <h1 className="text-brand text-2xl leading-snug font-extrabold">{title}</h1>
        {description && <p className="text-muted mt-2 text-sm">{description}</p>}
      </header>

      <section
        className={`mt-8 min-h-0 flex-1 ${contentScrollable ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {children}
      </section>
      <footer
        className={
          fixedFooter
            ? 'bg-surface border-border-subtle fixed right-0 bottom-[var(--app-vertical-offset)] left-0 z-30 mx-auto w-full max-w-[430px] border-t px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(2,23,48,0.08)]'
            : 'mt-8 shrink-0'
        }
      >
        {footer}
      </footer>
    </main>
  );
}
