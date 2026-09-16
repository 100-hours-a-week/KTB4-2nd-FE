import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Toggle } from './toggle';

type FormValues = { notifications: boolean };

function TestForm({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { notifications: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Toggle
        {...register('notifications')}
        label="알림 받기"
        description="여행 소식을 알려드려요."
      />
      <button type="submit">저장</button>
    </form>
  );
}

describe('Toggle', () => {
  it('레이블과 키보드로 켜고 끌 수 있다', async () => {
    const user = userEvent.setup();
    render(<Toggle label="알림 받기" defaultChecked />);

    const toggle = screen.getByRole('switch', { name: '알림 받기' });
    expect(toggle).toBeChecked();

    await user.click(screen.getByText('알림 받기'));
    expect(toggle).not.toBeChecked();

    toggle.focus();
    await user.keyboard(' ');
    expect(toggle).toBeChecked();
  });

  it('비활성화 상태에서는 변경되지 않는다', async () => {
    const user = userEvent.setup();
    render(<Toggle label="알림 받기" disabled />);

    const toggle = screen.getByRole('switch', { name: '알림 받기' });
    await user.click(screen.getByText('알림 받기'));

    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
  });

  it('React Hook Form에 불리언 값을 전달한다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    const toggle = screen.getByRole('switch', { name: '알림 받기' });
    expect(toggle).toHaveAccessibleDescription('여행 소식을 알려드려요.');

    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledWith({ notifications: true }, expect.anything());
  });
});
