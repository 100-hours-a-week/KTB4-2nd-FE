import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PageError } from './pageError';

describe('PageError', () => {
  it('로그인 오류가 아니라 화면을 불러오지 못했다고 안내하고 다시 시도할 수 있다', async () => {
    const reset = vi.fn();
    render(<PageError reset={reset} />);

    expect(screen.getByRole('heading', { name: '화면을 불러오지 못했어요' })).toBeInTheDocument();
    expect(screen.queryByText(/로그인 상태/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로 가기' })).toHaveAttribute('href', '/');

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
