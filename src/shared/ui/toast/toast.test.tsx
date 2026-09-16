import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { toast } from './toast-store';
import { ToastViewport } from './toast-viewport';

afterEach(() => {
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
    expect(screen.queryByText('저장되었습니다.')).not.toBeInTheDocument();
  });

  it('오류 토스트를 즉시 알리는 alert로 표시한다', () => {
    render(<ToastViewport />);

    act(() => {
      toast.error('저장에 실패했습니다.', { duration: 0 });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('저장에 실패했습니다.');
  });
});
