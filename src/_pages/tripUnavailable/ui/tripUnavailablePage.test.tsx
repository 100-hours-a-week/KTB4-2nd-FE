import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { takeLoginReturnPath } from '@/shared/lib/url';

import { TripUnavailablePage } from './tripUnavailablePage';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/trips/7' }));
vi.mock('@/features/manageAccount', () => ({
  useLogout: () => ({ mutate: logout, isPending: false }),
}));

describe('TripUnavailablePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
  });

  it('초대받은 사람만 볼 수 있다고 알리고, 볼 수 없는 이유와 지금 계정을 보여준다', () => {
    render(<TripUnavailablePage email="me@example.com" />);

    expect(screen.getByRole('heading', { name: '이 여행을 볼 수 없어요' })).toBeInTheDocument();
    expect(screen.getByText('초대받은 사람만 볼 수 있는 여행이에요.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('me@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로 가기' })).toHaveAttribute('href', '/');
  });

  it('다른 계정으로 로그인하면 로그인 뒤 이 링크로 돌아오도록 기억하고 로그아웃한다', async () => {
    render(<TripUnavailablePage email="me@example.com" />);

    await userEvent.click(screen.getByRole('button', { name: '다른 계정으로 로그인' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(takeLoginReturnPath()).toBe('/trips/7');
  });

  it('계정을 확인하지 못하면 계정 줄은 숨긴다', () => {
    render(<TripUnavailablePage email={null} />);

    expect(screen.queryByText(/지금 로그인한 계정/)).not.toBeInTheDocument();
  });
});
