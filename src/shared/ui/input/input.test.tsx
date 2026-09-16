import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './input';

type FormValues = { nickname: string };

function TestForm({ onSubmit = () => {} }: { onSubmit?: (data: FormValues) => void }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { nickname: '여담' }, mode: 'onBlur' });
  const nickname = useWatch({ control, name: 'nickname' });

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('nickname', {
          required: '닉네임을 입력해주세요.',
          maxLength: { value: 10, message: '10자 이하로 입력해주세요.' },
        })}
        label="닉네임"
        helperText="10자 이하로 입력해주세요."
        maxLength={10}
        characterCount={nickname.length}
        error={errors.nickname?.message}
      />
      <button type="submit">저장</button>
      <button type="button" onClick={() => reset({ nickname: '' })}>
        초기화
      </button>
      <button type="button" onClick={() => setValue('nickname', '제주여행')}>
        값 설정
      </button>
    </form>
  );
}

describe('Input with React Hook Form', () => {
  it('기본값, 입력, reset, setValue의 글자 수와 제출값을 동기화한다', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TestForm onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: '닉네임' });

    expect(input).toHaveValue('여담');
    expect(screen.getByText('2/10')).toBeInTheDocument();

    await user.type(input, '여행');
    expect(screen.getByText('4/10')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '초기화' }));
    expect(input).toHaveValue('');
    expect(screen.getByText('0/10')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '값 설정' }));
    expect(input).toHaveValue('제주여행');
    expect(screen.getByText('4/10')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ nickname: '제주여행' });
  });

  it('register의 blur 검증과 오류 입력 포커스가 동작한다', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    const input = screen.getByRole('textbox', { name: '닉네임' });

    await user.clear(input);
    await user.tab();
    expect(await screen.findByRole('alert')).toHaveTextContent('닉네임을 입력해주세요.');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(/닉네임을 입력해주세요/);
    expect(screen.queryByText('10자 이하로 입력해주세요.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('최대 길이를 넘는 입력을 제한한다', async () => {
    const user = userEvent.setup();
    render(<TestForm />);
    const input = screen.getByRole('textbox', { name: '닉네임' });

    await user.clear(input);
    await user.type(input, '12345678901');
    expect(input).toHaveValue('1234567890');
    expect(screen.getByText('10/10')).toBeInTheDocument();
  });
});
