import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { logout } from '@/features/manageAccount/api/logout';
import { withdraw } from '@/features/manageAccount/api/withdraw';
import { redirectToLogin } from '@/features/manageAccount/model/redirectToLogin';
import { useToastStore } from '@/shared/ui/toast/toastStore';

import { MyPage, type MyPageUser } from './myPage';

vi.mock('@/features/manageAccount/api/logout', () => ({ logout: vi.fn() }));
vi.mock('@/features/manageAccount/api/withdraw', () => ({ withdraw: vi.fn() }));
vi.mock('@/features/manageAccount/model/redirectToLogin', () => ({
  redirectToLogin: vi.fn(),
}));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));

const user: MyPageUser = { nickname: '여행하는 혜준', oauthConnected: true };

function axiosErrorWithStatus(status: number) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', undefined, config, null, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config,
  });
}

function renderMyPage(pageUser: MyPageUser | null = user) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MyPage user={pageUser} />
    </QueryClientProvider>,
  );
}

describe('MyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.getState().clear();
    vi.mocked(logout).mockResolvedValue(undefined);
    vi.mocked(withdraw).mockResolvedValue(undefined);
  });

  it('사용자 정보와 계정 메뉴를 표시한다', () => {
    renderMyPage();

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
    expect(screen.getByText('여행하는 혜준')).toBeInTheDocument();
    expect(screen.getByText('카카오 계정으로 연결됨')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '탈퇴하기' })).toBeInTheDocument();
  });

  it('이용약관과 개인정보처리방침을 각각의 경로로 나눠 제공한다', () => {
    renderMyPage();

    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute(
      'href',
      '/terms/service',
    );
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute(
      'href',
      '/terms/privacy',
    );
  });

  it('하단 메뉴의 이동 경로를 제공한다', () => {
    renderMyPage();

    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '마이페이지' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('카카오 프로필 이미지가 있으면 아바타에 표시한다', () => {
    renderMyPage({ ...user, profileImageUrl: 'https://k.kakaocdn.net/dn/profile/img_640x640.jpg' });

    expect(screen.getByRole('img', { name: '여행하는 혜준 프로필 사진' })).toBeInTheDocument();
  });

  it('카카오 프로필 이미지가 없으면 기본 아이콘을 표시한다', () => {
    renderMyPage({ ...user, profileImageUrl: null });

    expect(screen.queryByRole('img', { name: /프로필 사진/ })).not.toBeInTheDocument();
  });

  it('프로필을 불러오지 못하면 스켈레톤과 안내 토스트를 보여준다', () => {
    renderMyPage(null);

    expect(screen.getByRole('status', { name: '프로필 불러오는 중' })).toBeInTheDocument();
    expect(screen.queryByText('여행하는 혜준')).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ message: '잠시 후 다시 시도해주세요.', variant: 'error' }),
    ]);
  });

  it('로그아웃을 누르면 CSRF 토큰과 함께 로그아웃 API를 부르고 로그인 화면으로 보낸다', async () => {
    renderMyPage();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(logout).toHaveBeenCalledWith('csrf-token');
    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledOnce());
  });

  it('로그아웃에 실패하면 토스트를 띄우고 이동하지 않는다', async () => {
    vi.mocked(logout).mockRejectedValue(new Error('failed'));
    renderMyPage();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          message: '로그아웃하지 못했어요. 잠시 후 다시 시도해주세요.',
          variant: 'error',
        }),
      ]),
    );
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it('탈퇴하기를 누르면 확인 다이얼로그를 먼저 띄운다', async () => {
    renderMyPage();

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }));

    expect(screen.getByRole('alertdialog', { name: '정말 탈퇴하시겠어요?' })).toBeInTheDocument();
    expect(withdraw).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(withdraw).not.toHaveBeenCalled();
  });

  it('다이얼로그에서 탈퇴를 확정하면 탈퇴 API를 부르고 로그인 화면으로 보낸다', async () => {
    renderMyPage();

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }));
    const dialog = screen.getByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '탈퇴하기' }));

    expect(withdraw).toHaveBeenCalledWith('csrf-token');
    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledOnce());
  });

  it('탈퇴에 실패하면 다이얼로그를 닫고 토스트를 띄운다', async () => {
    vi.mocked(withdraw).mockRejectedValue(new Error('failed'));
    renderMyPage();

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }));
    const dialog = screen.getByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '탈퇴하기' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        message: '탈퇴하지 못했어요. 잠시 후 다시 시도해주세요.',
        variant: 'error',
      }),
    ]);
    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it('이미 탈퇴한 계정이면 토스트 없이 로그인 화면으로 보낸다', async () => {
    vi.mocked(withdraw).mockRejectedValue(axiosErrorWithStatus(404));
    renderMyPage();

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }));
    const dialog = screen.getByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: '탈퇴하기' }));

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledOnce());
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
