import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startKakaoLogin } from '../api/startKakaoLogin';
import { KakaoLoginButton } from './kakaoLoginButton';

vi.mock('../api/startKakaoLogin', () => ({
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
  it('클릭하면 카카오 로그인을 시작하고 이동 전까지 로딩 상태를 유지한다', async () => {
    const user = userEvent.setup();
    vi.mocked(startKakaoLogin).mockReturnValue(new Promise<void>(() => {}));
    renderKakaoLoginButton();

    await user.click(screen.getByRole('button', { name: '카카오로 시작하기' }));

    expect(startKakaoLogin).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '카카오 연결 중…' })).toBeDisabled();
  });

  it('뒤로 가기로 페이지가 복원되면 버튼을 다시 누를 수 있게 한다', async () => {
    const user = userEvent.setup();
    vi.mocked(startKakaoLogin).mockReturnValue(new Promise<void>(() => {}));
    renderKakaoLoginButton();

    await user.click(screen.getByRole('button', { name: '카카오로 시작하기' }));
    expect(screen.getByRole('button', { name: '카카오 연결 중…' })).toBeDisabled();

    act(() => {
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });

    expect(await screen.findByRole('button', { name: '카카오로 시작하기' })).toBeEnabled();
  });
});
