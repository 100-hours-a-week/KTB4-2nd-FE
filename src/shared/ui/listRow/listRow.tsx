import Link from 'next/link';
import type { ReactNode } from 'react';

export type ListRowProps = {
  /** 왼쪽 아이콘. 24px 안에 들어가는 크기를 권장합니다. */
  icon?: ReactNode;
  label: ReactNode;
  /** 오른쪽 끝 요소. 기본값은 이동을 뜻하는 화살표입니다. */
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
};

const rowClassName =
  'group flex min-h-13 w-full items-center gap-3 rounded-row border border-border-subtle bg-surface px-4 text-left transition-colors hover:bg-surface-subtle focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2';

export function ListRow({
  icon,
  label,
  trailing = <ChevronRightIcon />,
  href,
  onClick,
  className = '',
}: ListRowProps) {
  const content = (
    <>
      {icon && <span className="text-brand shrink-0">{icon}</span>}
      <span className="flex-1 truncate text-sm font-bold tracking-[-0.01em]">{label}</span>
      {trailing}
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={`${rowClassName} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${rowClassName} ${className}`}>
      {content}
    </button>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="text-muted shrink-0 transition-transform group-hover:translate-x-0.5"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
