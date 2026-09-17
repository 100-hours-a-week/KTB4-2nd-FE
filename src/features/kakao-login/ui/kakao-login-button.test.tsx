import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startKakaoLogin } from '../api/start-kakao-login';
import { KakaoLoginButton } from './kakao-login-button';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('../api/start-kakao-login', () => ({
  startKakaoLogin: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderKakaoLoginButton() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <KakaoLoginButton />
    </QueryClientProvider>,
  );
}

describe('KakaoLoginButton', () => {
  it('임시 로그인이 성공하면 회원가입 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    let resolveLogin!: () => void;
    vi.mocked(startKakaoLogin).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        }),
    );
    renderKakaoLoginButton();

    await user.click(screen.getByRole('button', { name: '카카오로 시작하기' }));

    expect(screen.getByRole('button', { name: '카카오 연결 중…' })).toBeDisabled();
    act(() => resolveLogin());
    await waitFor(() => expect(push).toHaveBeenCalledWith('/signup'));
  });
});
