'use client';

import Link from 'next/link';

export type BottomNavigationIcon = 'home' | 'list' | 'plus' | 'search' | 'profile';

export type BottomNavigationItem = {
  id: string;
  label: string;
  icon: BottomNavigationIcon;
  href?: string;
  disabled?: boolean;
  action?: boolean;
};

export type BottomNavigationProps = {
  items: readonly BottomNavigationItem[];
  activeId: string;
  onSelect?: (id: string) => void;
  className?: string;
};

export function BottomNavigation({
  items,
  activeId,
  onSelect,
  className = '',
}: BottomNavigationProps) {
  return (
    <nav
      aria-label="하단 메뉴"
      className={`bg-surface fixed right-0 bottom-0 left-0 z-40 mx-auto w-full max-w-[430px] border-t border-slate-200 shadow-[0_-4px_20px_rgba(2,23,48,0.05)] ${className}`}
    >
      <div className="flex items-stretch px-2 pt-1 pb-[max(8px,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = item.id === activeId;
          const isAction = item.action === true;
          const content = isAction ? (
            <span className="bg-brand shadow-[0_6px_18px_rgba(2,23,48,0.24)] -mt-7 flex size-14 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <NavigationIcon name={item.icon} />
            </span>
          ) : (
            <>
              <NavigationIcon name={item.icon} />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </>
          );
          const itemClassName = `group flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-control transition-[color,background-color,transform] duration-200 ease-out focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2 ${isAction ? 'text-brand' : active ? 'text-brand' : 'text-muted hover:bg-brand/5 hover:text-brand'} ${item.disabled ? 'cursor-not-allowed opacity-40' : isAction ? 'cursor-pointer' : 'cursor-pointer active:scale-[0.96]'}`;

          return item.href && !item.disabled ? (
            <Link
              key={item.id}
              href={item.href}
              aria-label={isAction ? item.label : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect?.(item.id)}
              className={itemClassName}
            >
              {content}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              aria-label={isAction ? item.label : undefined}
              disabled={item.disabled}
              aria-pressed={isAction ? undefined : active}
              onClick={() => onSelect?.(item.id)}
              className={itemClassName}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NavigationIcon({ name }: { name: BottomNavigationIcon }) {
  const paths = {
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />,
    list: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'plus' ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
