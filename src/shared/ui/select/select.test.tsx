import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './select';

const options = [
  { value: 'domestic', label: '국내 여행' },
  { value: 'overseas', label: '해외 여행' },
] as const;

type FormValues = { tripType: string };

function TestForm({ onSubmit }: { onSubmit: (data: FormValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { tripType: '' } });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Select
        {...register('tripType', { required: '여행 유형을 선택해주세요.' })}
        label="여행 유형"
        options={options}
        helperText="여행 유형을 선택해주세요."
        error={errors.tripType?.message}
        required
      />
      <button type="submit">저장</button>
    </form>
  );
}

describe('Select with React Hook Form', () => {
  it('옵션을 선택하고 폼 값으로 제출한다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    const select = screen.getByRole('combobox', { name: /여행 유형/ });
    await user.click(select);
    await user.click(screen.getByRole('option', { name: '해외 여행' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ tripType: 'overseas' }, expect.anything()),
    );
  });

  it('선택하지 않고 제출하면 접근 가능한 오류를 표시한다', async () => {
    const user = userEvent.setup();
    render(<TestForm onSubmit={() => {}} />);

    const select = screen.getByRole('combobox', { name: /여행 유형/ });
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('여행 유형을 선택해주세요.');
    expect(select).toBeInvalid();
    expect(select).toHaveAccessibleDescription('여행 유형을 선택해주세요.');
  });

  it('키보드로 목록을 열고 옵션을 선택한다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);

    const select = screen.getByRole('combobox', { name: /여행 유형/ });
    select.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ tripType: 'overseas' }, expect.anything()),
    );
  });
});
