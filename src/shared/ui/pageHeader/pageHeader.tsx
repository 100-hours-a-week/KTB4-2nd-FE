import Link from 'next/link';
import type { ReactNode } from 'react';

type PageHeaderBaseProps = {
  title?: ReactNode;
  backLabel: string;
  action?: ReactNode;
  className?: string;
};

type PageHeaderNavigation =
  | {
      backHref: string;
      onBack?: never;
      backDisabled?: never;
    }
  | {
      backHref?: never;
      onBack: () => void;
      backDisabled?: boolean;
    };

export type PageHeaderProps = PageHeaderBaseProps & PageHeaderNavigation;

const navigationClassName =
  'hover:bg-brand/5 focus-visible:outline-brand -ml-2 inline-flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-30';

export function PageHeader({
  title,
  backLabel,
  action,
  className = '',
  ...navigation
}: PageHeaderProps) {
  const backControl =
    navigation.backHref !== undefined ? (
      <Link href={navigation.backHref} aria-label={backLabel} className={navigationClassName}>
        <BackIcon />
      </Link>
    ) : (
      <button
        type="button"
        aria-label={backLabel}
        disabled={navigation.backDisabled}
        onClick={navigation.onBack}
        className={navigationClassName}
      >
        <BackIcon />
      </button>
    );

  return (
    <header
      className={`bg-surface/95 sticky top-0 z-20 grid min-h-12 grid-cols-[44px_minmax(0,1fr)_44px] items-center backdrop-blur-sm ${className}`}
    >
      {backControl}
      {title === undefined ? (
        <span aria-hidden="true" />
      ) : (
        <h1 className="text-brand truncate px-2 text-center text-[17px] font-extrabold tracking-[-0.02em]">
          {title}
        </h1>
      )}
      <div className="flex min-w-11 justify-end">{action}</div>
    </header>
  );
}

function BackIcon() {
  return (
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
  );
}
