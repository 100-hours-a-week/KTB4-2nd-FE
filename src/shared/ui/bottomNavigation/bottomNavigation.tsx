'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

import { NavigationIcon, type NavigationIconName } from '@/shared/ui/icons';

export type BottomNavigationIcon = NavigationIconName;

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

const subscribeToClient = () => () => undefined;

export function BottomNavigation({
  items,
  activeId,
  onSelect,
  className = '',
}: BottomNavigationProps) {
  const isClient = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );

  if (!isClient) return null;

  return createPortal(
    <nav
      aria-label="하단 메뉴"
      className={`bg-surface fixed right-0 bottom-[var(--app-vertical-offset)] left-0 z-40 mx-auto w-full max-w-[430px] border-t border-slate-200 shadow-[0_-4px_20px_rgba(2,23,48,0.05)] ${className}`}
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
    </nav>,
    document.body,
  );
}
