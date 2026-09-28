import type { ReactNode } from 'react';

import { PageHeader } from '@/shared/ui/pageHeader';

type TripCreateStepLayoutProps = {
  title: ReactNode;
  description?: string;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export function TripCreateStepLayout({
  title,
  description,
  onBack,
  children,
  footer,
}: TripCreateStepLayoutProps) {
  return (
    <main className="bg-surface mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] text-foreground">
      <PageHeader backLabel="이전 단계로 이동" onBack={onBack} />

      <header className="mt-8">
        <h1 className="text-brand text-2xl leading-snug font-extrabold">{title}</h1>
        {description && <p className="text-muted mt-2 text-sm">{description}</p>}
      </header>

      <section className="mt-8 flex-1">{children}</section>
      <footer className="mt-8">{footer}</footer>
    </main>
  );
}
