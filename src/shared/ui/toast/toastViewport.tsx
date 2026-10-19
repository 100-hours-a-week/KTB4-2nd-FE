'use client';

import { type PointerEvent, useEffect, useRef, useState } from 'react';

import { type ToastItem, useToastStore } from './toastStore';

const progressStyle: Record<ToastItem['variant'], string> = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-brand',
  warning: 'bg-warning',
};

const LEAVE_MS = 200;
/** 뒤에 쌓인 토스트가 앞 토스트 아래로 살짝 보이는 간격과 축소 비율입니다. */
const STACK_OFFSET_PX = 8;
const STACK_SCALE_STEP = 0.05;
/** 이만큼 위로 끌어올리거나, 짧고 빠르게 튕겨 올리면 닫습니다. */
const SWIPE_DISMISS_PX = 32;
const FLICK_DISMISS_PX = 10;
const FLICK_MAX_MS = 200;

type ExitKind = 'fade' | 'swipe';

function ToastMessage({ toast }: { toast: ToastItem }) {
  const remove = useToastStore((state) => state.remove);
  const [exit, setExit] = useState<ExitKind | null>(null);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const drag = useRef<{ pointerId: number; startY: number; startedAt: number } | null>(null);
  const remaining = useRef(toast.duration);
  const dragging = dragOffset !== null;

  // 손가락으로 잡고 있는 동안에는 남은 시간을 멈췄다가, 놓으면 남은 만큼만 이어서 셉니다.
  useEffect(() => {
    if (toast.duration <= 0 || dragging || exit) return;

    const startedAt = Date.now();
    const timeoutId = window.setTimeout(() => setExit('fade'), remaining.current);
    return () => {
      window.clearTimeout(timeoutId);
      remaining.current -= Date.now() - startedAt;
    };
  }, [dragging, exit, toast.duration]);

  useEffect(() => {
    if (!exit) return;

    const timeoutId = window.setTimeout(() => remove(toast.id), LEAVE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [exit, remove, toast.id]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (exit || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;

    drag.current = { pointerId: event.pointerId, startY: event.clientY, startedAt: Date.now() };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragOffset(0);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;

    const offset = event.clientY - drag.current.startY;
    // 아래로 끌면 닫히지 않는다는 느낌이 들도록 조금만 따라오게 합니다.
    setDragOffset(offset < 0 ? offset : offset * 0.2);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (current?.pointerId !== event.pointerId) return;
    drag.current = null;

    const offset = event.clientY - current.startY;
    const flicked = offset <= -FLICK_DISMISS_PX && Date.now() - current.startedAt < FLICK_MAX_MS;
    if (event.type === 'pointerup' && (offset <= -SWIPE_DISMISS_PX || flicked)) {
      setExit('swipe');
    }
    setDragOffset(null);
  };

  const transform =
    exit === 'swipe'
      ? 'translateY(calc(-100% - 24px))'
      : exit === 'fade'
        ? 'translateY(-8px)'
        : dragging
          ? `translateY(${dragOffset}px)`
          : undefined;
  const opacity = exit
    ? 0
    : dragging && dragOffset < 0
      ? Math.max(0.3, 1 + dragOffset / 150)
      : undefined;

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{ transform, opacity }}
      className={`toast-enter rounded-control bg-surface text-brand relative flex min-h-14 cursor-grab touch-none items-center gap-3 overflow-hidden border border-slate-200 px-4 py-3 shadow-lg select-none active:cursor-grabbing ${dragging ? '' : 'transition-[opacity,transform] duration-200 ease-out'}`}
    >
      <p className="min-w-0 flex-1 text-sm font-medium break-words">{toast.message}</p>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => setExit('fade')}
        className="text-muted hover:text-brand focus-visible:outline-brand shrink-0 cursor-pointer rounded-[4px] px-1 text-xl leading-none focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ×
      </button>
      {toast.duration > 0 && (
        <span
          aria-hidden="true"
          className={`toast-progress absolute inset-x-0 bottom-0 h-1 ${progressStyle[toast.variant]}`}
          style={{
            animationDuration: `${toast.duration}ms`,
            animationPlayState: dragging ? 'paused' : 'running',
          }}
        />
      )}
    </div>
  );
}

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-label="알림"
      className="pointer-events-none fixed top-[calc(var(--app-vertical-offset)+1.5rem)] left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
    >
      {toasts.map((toast, index) => {
        // 가장 최근 토스트가 맨 앞에 오고, 이전 토스트는 그 뒤로 작게 겹쳐 쌓입니다.
        const depth = toasts.length - 1 - index;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto absolute inset-x-0 top-0 origin-bottom transition-transform duration-300 ease-out"
            style={{
              zIndex: toasts.length - depth,
              transform: `translateY(${depth * STACK_OFFSET_PX}px) scale(${1 - depth * STACK_SCALE_STEP})`,
            }}
          >
            <ToastMessage toast={toast} />
          </div>
        );
      })}
    </div>
  );
}
