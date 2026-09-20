import type { ReactNode } from 'react';

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
      <button
        type="button"
        aria-label="이전 단계로 이동"
        onClick={onBack}
        className="focus-visible:outline-brand -ml-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
      >
        <svg
          aria-hidden="true"
          width="25"
          height="25"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <header className="mt-8">
        <h1 className="text-brand text-2xl leading-snug font-extrabold">{title}</h1>
        {description && <p className="text-muted mt-2 text-sm">{description}</p>}
      </header>

      <section className="mt-8 flex-1">{children}</section>
      <footer className="mt-8">{footer}</footer>
    </main>
  );
}
