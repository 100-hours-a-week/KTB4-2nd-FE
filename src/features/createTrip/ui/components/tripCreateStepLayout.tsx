import { useContext, type ReactNode } from 'react';

import { PageHeader } from '@/shared/ui/pageHeader';

import { TRIP_CREATE_STEPS, type TripCreateStep } from '../../model/types';
import { TripFormModeContext } from './tripFormMode';

type TripCreateStepLayoutProps = {
  step: TripCreateStep;
  title: ReactNode;
  description?: string;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
  fixedFooter?: boolean;
  contentScrollable?: boolean;
};

export function TripCreateStepLayout({
  step,
  title,
  description,
  onBack,
  children,
  footer,
  fixedFooter = false,
  contentScrollable = true,
}: TripCreateStepLayoutProps) {
  const mode = useContext(TripFormModeContext);
  const stepNumber = TRIP_CREATE_STEPS.indexOf(step) + 1;
  const footerFade =
    'before:from-surface before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-gradient-to-t before:to-transparent';

  return (
    <main
      className={`bg-surface text-brand mx-auto flex h-full min-h-0 w-full max-w-107.5 flex-col overflow-hidden px-6 pt-[max(8px,env(safe-area-inset-top))] ${fixedFooter ? 'pb-[calc(92px+env(safe-area-inset-bottom))]' : ''}`}
    >
      <PageHeader
        title={mode === 'edit' ? '여행 수정' : '여행 만들기'}
        backLabel="이전 단계로 이동"
        onBack={onBack}
        className="shrink-0"
      />

      <div className="mt-2 flex shrink-0 items-center gap-3">
        <div aria-hidden="true" className="flex flex-1 gap-1">
          {TRIP_CREATE_STEPS.map((item, index) => (
            <span
              key={item}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${index < stepNumber ? 'bg-brand' : 'bg-border-subtle'}`}
            />
          ))}
        </div>
        <p className="text-muted shrink-0 text-xs font-semibold tabular-nums">
          <span className="sr-only">전체 {TRIP_CREATE_STEPS.length}단계 중 </span>
          <strong className="text-brand">{stepNumber}</strong>
          <span aria-hidden="true"> / {TRIP_CREATE_STEPS.length}</span>
          <span className="sr-only">단계</span>
        </p>
      </div>

      <header className="mt-7 shrink-0">
        <h2 className="text-page-title">{title}</h2>
        {description && <p className="text-description text-muted mt-2">{description}</p>}
      </header>

      <section
        className={`mt-7 min-h-0 flex-1 ${contentScrollable ? 'overflow-y-auto overscroll-contain pb-4' : 'overflow-clip'}`}
      >
        {children}
      </section>
      <footer
        className={
          fixedFooter
            ? `bg-surface fixed right-0 bottom-[var(--app-vertical-offset)] left-0 z-30 mx-auto w-full max-w-[430px] px-6 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] ${footerFade}`
            : `bg-surface relative shrink-0 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] ${footerFade}`
        }
      >
        {footer}
      </footer>
    </main>
  );
}
