'use client';

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { LONG_PRESS_DELAY_MS, LONG_PRESS_MOVE_TOLERANCE_PX } from '../config/longPress';

type UseLongPressOptions = {
  onLongPress: () => void;
  onClick: () => void;
  disabled?: boolean;
};

export function useLongPress({ onLongPress, onClick, disabled = false }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const triggeredRef = useRef(false);

  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => cancel, []);

  return {
    onClick: () => {
      if (triggeredRef.current) {
        triggeredRef.current = false;
        return;
      }
      onClick();
    },
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;

      cancel();
      triggeredRef.current = false;
      startPointRef.current = { x: event.clientX, y: event.clientY };
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        triggeredRef.current = true;
        onLongPress();
      }, LONG_PRESS_DELAY_MS);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => {
      const movedX = Math.abs(event.clientX - startPointRef.current.x);
      const movedY = Math.abs(event.clientY - startPointRef.current.y);
      if (movedX > LONG_PRESS_MOVE_TOLERANCE_PX || movedY > LONG_PRESS_MOVE_TOLERANCE_PX) {
        cancel();
      }
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
