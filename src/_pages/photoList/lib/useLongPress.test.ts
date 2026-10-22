import { act, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LONG_PRESS_DELAY_MS } from '../config/longPress';
import { useLongPress } from './useLongPress';

function pointer(x = 0, y = 0) {
  return { button: 0, clientX: x, clientY: y } as ReactPointerEvent<HTMLElement>;
}

function setup(disabled = false) {
  const onLongPress = vi.fn();
  const onClick = vi.fn();
  const { result } = renderHook(() => useLongPress({ onLongPress, onClick, disabled }));
  return { handlers: () => result.current, onLongPress, onClick };
}

describe('useLongPress', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('짧게 누르면 클릭만 부른다', () => {
    const { handlers, onLongPress, onClick } = setup();

    act(() => handlers().onPointerDown(pointer()));
    act(() => handlers().onPointerUp());
    act(() => handlers().onClick());

    expect(onClick).toHaveBeenCalledOnce();
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('길게 누르면 길게 누르기만 부르고 뒤따르는 클릭은 무시한다', () => {
    const { handlers, onLongPress, onClick } = setup();

    act(() => handlers().onPointerDown(pointer()));
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY_MS));
    act(() => handlers().onClick());

    expect(onLongPress).toHaveBeenCalledOnce();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('누르는 중 크게 움직이면 스크롤로 보고 길게 누르기를 취소한다', () => {
    const { handlers, onLongPress } = setup();

    act(() => handlers().onPointerDown(pointer(0, 0)));
    act(() => handlers().onPointerMove(pointer(0, 30)));
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY_MS));

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('disabled면 길게 눌러도 감지하지 않는다', () => {
    const { handlers, onLongPress } = setup(true);

    act(() => handlers().onPointerDown(pointer()));
    act(() => vi.advanceTimersByTime(LONG_PRESS_DELAY_MS));

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
