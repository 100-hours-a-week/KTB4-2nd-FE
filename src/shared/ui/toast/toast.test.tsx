import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toast } from './toastStore';
import { ToastViewport } from './toastViewport';

const FLICK_WAIT_MS = 250;

afterEach(() => {
  vi.useRealTimers();
  act(() => toast.dismiss());
});

describe('Toast', () => {
  it('전역 호출로 토스트를 표시하고 닫는다', async () => {
    const user = userEvent.setup();
    render(<ToastViewport />);

    act(() => {
      toast.success('저장되었습니다.', { duration: 0 });
    });

    expect(screen.getByRole('status')).toHaveTextContent('저장되었습니다.');

    await user.click(screen.getByRole('button', { name: '알림 닫기' }));
    await waitFor(() => expect(screen.queryByText('저장되었습니다.')).not.toBeInTheDocument());
  });

  it('오류 토스트를 즉시 알리는 alert로 표시한다', () => {
    render(<ToastViewport />);

    act(() => {
      toast.error('저장에 실패했습니다.', { duration: 0 });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('저장에 실패했습니다.');
  });

  it('기본 3초 동안 남은 시간 막대를 줄이고, 시간이 지나면 사라진다', () => {
    vi.useFakeTimers();
    const { container } = render(<ToastViewport />);

    act(() => {
      toast.info('잠시 후 사라져요.');
    });

    expect(container.querySelector('.toast-progress')).toHaveStyle({
      animationDuration: '3000ms',
    });

    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByText('잠시 후 사라져요.')).toBeInTheDocument();

    // 시간이 끝나면 살짝 흐려지며 올라간 뒤 지워집니다.
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText('잠시 후 사라져요.')).not.toBeInTheDocument();
  });

  it('여러 개를 띄우면 최근 토스트를 맨 앞에 두고 이전 토스트를 뒤로 겹친다', () => {
    render(<ToastViewport />);

    act(() => {
      toast.info('첫 번째', { duration: 0 });
      toast.info('두 번째', { duration: 0 });
    });

    const [first, second] = screen.getAllByRole('status').map((item) => item.parentElement);
    expect(Number(second?.style.zIndex)).toBeGreaterThan(Number(first?.style.zIndex));
    expect(first?.style.transform).toContain('scale(0.95)');
    expect(second?.style.transform).toContain('scale(1)');
  });

  it('위로 끌어올리면 닫히고, 조금만 끌었다 놓으면 제자리로 돌아온다', async () => {
    render(<ToastViewport />);

    act(() => {
      toast.info('위로 밀어서 닫기', { duration: 0 });
    });
    const item = screen.getByRole('status');

    fireEvent.pointerDown(item, { pointerId: 1, button: 0, clientY: 100 });
    fireEvent.pointerMove(item, { pointerId: 1, clientY: 90 });
    await new Promise((resolve) => setTimeout(resolve, FLICK_WAIT_MS));
    fireEvent.pointerUp(item, { pointerId: 1, clientY: 90 });
    expect(screen.getByText('위로 밀어서 닫기')).toBeInTheDocument();
    expect(item.style.transform).toBe('');

    fireEvent.pointerDown(item, { pointerId: 2, button: 0, clientY: 100 });
    fireEvent.pointerMove(item, { pointerId: 2, clientY: 50 });
    fireEvent.pointerUp(item, { pointerId: 2, clientY: 50 });
    await waitFor(() => expect(screen.queryByText('위로 밀어서 닫기')).not.toBeInTheDocument());
  });
});
