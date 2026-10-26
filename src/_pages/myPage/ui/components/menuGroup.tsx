import Link from 'next/link';
import type { ReactNode } from 'react';

import { ChevronRightIcon } from '@/shared/ui/icons';

export function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="text-muted mb-2 px-1 text-xs font-bold">{title}</h2>
      <ul className="border-border-subtle rounded-card divide-border-subtle divide-y overflow-hidden border">
        {children}
      </ul>
    </section>
  );
}

export function MenuRow({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group hover:bg-surface-subtle focus-visible:outline-brand flex min-h-13 items-center gap-3 px-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        <span className="text-brand shrink-0">{icon}</span>
        <span className="flex-1 truncate text-sm font-bold tracking-[-0.01em]">{label}</span>
        {value && <span className="text-muted shrink-0 text-xs font-semibold">{value}</span>}
        <ChevronRightIcon
          className="text-muted shrink-0 transition-transform group-hover:translate-x-0.5"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          size="18"
          variant="wide"
        />
      </Link>
    </li>
  );
}
