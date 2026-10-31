import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('기본 버튼은 폼을 제출하지 않고 명시적 submit 버튼은 제출한다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>일반 액션</Button>
        <Button type="submit">저장</Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: '일반 액션' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('로딩과 비활성 상태에서 중복 클릭을 차단한다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <Button isLoading loadingText="저장 중…" onClick={onClick}>
        저장
      </Button>,
    );
    const button = screen.getByRole('button', { name: '저장 중…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <Button disabled onClick={onClick}>
        저장
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button onClick={onClick}>저장</Button>);
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('크기 옵션을 네이티브 속성으로 전달하지 않고 ref를 실제 버튼에 연결한다', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} size="lg" aria-label="여행 저장">
        저장
      </Button>,
    );
    const button = screen.getByRole('button', { name: '여행 저장' });
    expect(ref.current).toBe(button);
    expect(button).not.toHaveAttribute('size');
  });
});
