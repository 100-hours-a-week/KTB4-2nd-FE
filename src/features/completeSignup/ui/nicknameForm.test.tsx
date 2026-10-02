import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastViewport, toast } from '@/shared/ui/toast';
import { identify, track } from '@/shared/lib/analytics';

import { completeSignup } from '../api/completeSignup';
import { NicknameForm } from './nicknameForm';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('../api/completeSignup', () => ({
  completeSignup: vi.fn(),
}));
vi.mock('@/shared/lib/analytics', () => ({
  EVENTS: { SIGN_UP: 'sign_up' },
  identify: vi.fn(),
  track: vi.fn(),
}));

afterEach(() => {
  act(() => toast.dismiss());
  vi.clearAllMocks();
});

function renderNicknameForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NicknameForm />
      <ToastViewport />
    </QueryClientProvider>,
  );
}

describe('NicknameForm', () => {
  it('유효한 닉네임만 제출한다', async () => {
    const user = userEvent.setup();
    vi.mocked(completeSignup).mockResolvedValue({
      userId: 1,
      nickname: '여담2026',
      expiresIn: 1800,
    });
    renderNicknameForm();

    const input = screen.getByRole('textbox', { name: '닉네임' });
    const submitButton = screen.getByRole('button', { name: '확인' });
    expect(submitButton).toBeDisabled();

    await user.type(input, '여담2026');
    expect(screen.getByText('6/10')).toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    await waitFor(() => expect(completeSignup).toHaveBeenCalledWith({ nickname: '여담2026' }));
    expect(await screen.findByRole('status')).toHaveTextContent('닉네임이 저장되었어요.');
    expect(identify).toHaveBeenCalledWith(1, { signup_method: 'kakao' });
    expect(track).toHaveBeenCalledWith('sign_up', { method: 'kakao' });
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('공백과 특수문자를 오류로 표시한다', async () => {
    const user = userEvent.setup();
    renderNicknameForm();

    await user.type(screen.getByRole('textbox', { name: '닉네임' }), '여 담');

    expect(await screen.findByRole('alert')).toHaveTextContent('공백과 특수문자는 쓸 수 없어요.');
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  });
});
