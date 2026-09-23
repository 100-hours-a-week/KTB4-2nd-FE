import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useToastStore } from '@/shared/ui/toast/toastStore';

import { MyPage } from './myPage';

const user = { nickname: '여행하는 혜준', oauthConnected: true };

describe('MyPage', () => {
  beforeEach(() => {
    useToastStore.getState().clear();
  });

  it('사용자 정보와 계정 메뉴를 표시한다', () => {
    render(<MyPage user={user} />);

    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
    expect(screen.getByText('여행하는 혜준')).toBeInTheDocument();
    expect(screen.getByText('카카오 계정으로 연결됨')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '탈퇴하기' })).toBeInTheDocument();
  });

  it('이용약관과 개인정보처리방침을 각각의 경로로 나눠 제공한다', () => {
    render(<MyPage user={user} />);

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
    render(<MyPage user={user} />);

    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '마이페이지' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('카카오 프로필 이미지가 있으면 아바타에 표시한다', () => {
    render(
      <MyPage
        user={{ ...user, profileImageUrl: 'https://k.kakaocdn.net/dn/profile/img_640x640.jpg' }}
      />,
    );

    expect(screen.getByRole('img', { name: '여행하는 혜준 프로필 사진' })).toBeInTheDocument();
  });

  it('카카오 프로필 이미지가 없으면 기본 아이콘을 표시한다', () => {
    render(<MyPage user={{ ...user, profileImageUrl: null }} />);

    expect(screen.queryByRole('img', { name: /프로필 사진/ })).not.toBeInTheDocument();
  });

  it('프로필을 불러오지 못하면 스켈레톤과 안내 토스트를 보여준다', () => {
    render(<MyPage user={null} />);

    expect(screen.getByRole('status', { name: '프로필 불러오는 중' })).toBeInTheDocument();
    expect(screen.queryByText('여행하는 혜준')).not.toBeInTheDocument();
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({ message: '잠시 후 다시 시도해주세요.', variant: 'error' }),
    ]);
  });

  it('탈퇴하기를 누르면 확인 다이얼로그를 먼저 띄운다', async () => {
    const onWithdraw = vi.fn();
    render(<MyPage user={user} onWithdraw={onWithdraw} />);

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }));

    const dialog = screen.getByRole('alertdialog', { name: '정말 탈퇴하시겠어요?' });
    expect(dialog).toBeInTheDocument();
    expect(onWithdraw).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onWithdraw).not.toHaveBeenCalled();
  });

  it('다이얼로그에서 탈퇴를 확정하면 콜백을 호출한다', async () => {
    const onWithdraw = vi.fn();
    render(<MyPage user={user} onWithdraw={onWithdraw} />);

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }));
    const dialog = screen.getByRole('alertdialog');

    await userEvent.click(within(dialog).getByRole('button', { name: '탈퇴하기' }));

    expect(onWithdraw).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('로그아웃을 누르면 콜백을 호출한다', async () => {
    const onLogout = vi.fn();
    render(<MyPage user={user} onLogout={onLogout} />);

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(onLogout).toHaveBeenCalledOnce();
  });
});
