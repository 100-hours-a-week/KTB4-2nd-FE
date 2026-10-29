import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@/shared/ui/toast';

import { createTripShare } from '../api/createTripShare';
import { searchShareUser } from '../api/searchShareUser';
import { TripShareDialog } from './tripShareDialog';

vi.mock('../api/searchShareUser', () => ({ searchShareUser: vi.fn() }));
vi.mock('../api/createTripShare', () => ({ createTripShare: vi.fn() }));
vi.mock('@/shared/api/browser', () => ({
  fetchCsrfToken: vi.fn().mockResolvedValue('csrf-token'),
}));
vi.mock('@/shared/ui/toast', () => ({ toast: { success: vi.fn() } }));

const hazel = { userId: 12, nickname: '헤이즐', email: 'hazel@gmail.com' };

function apiError(status: number, message: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', undefined, config, null, {
    status,
    statusText: '',
    data: { message },
    headers: {},
    config,
  });
}

function renderDialog() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TripShareDialog open tripId={7} tripName="제주도 가을 여행" onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

async function searchEmail(email: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox', { name: '공유할 이메일' }), email);
  await user.click(screen.getByRole('button', { name: '찾기' }));
  return user;
}

describe('TripShareDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('이메일로 사용자를 찾고 고른 권한으로 공유를 등록한다', async () => {
    vi.mocked(searchShareUser).mockResolvedValue(hazel);
    vi.mocked(createTripShare).mockResolvedValue({
      tripShareId: 3,
      granteeUserId: 12,
      permission: 'WRITE',
      expiresAt: '2026-10-30T15:20:00+09:00',
    });
    renderDialog();

    const user = await searchEmail('  hazel@gmail.com ');

    expect(searchShareUser).toHaveBeenCalledWith('hazel@gmail.com');
    expect(await screen.findByText('헤이즐')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: '헤이즐 공유 권한' }));
    await user.click(screen.getByRole('option', { name: '편집 허용' }));
    await user.click(screen.getByRole('button', { name: '추가하기' }));

    await waitFor(() =>
      expect(createTripShare).toHaveBeenCalledWith(
        7,
        { granteeUserId: 12, permission: 'WRITE' },
        'csrf-token',
      ),
    );
    expect(toast.success).toHaveBeenCalledWith('헤이즐님에게 공유했어요.');
    expect(await screen.findByText('공유한 사람 1')).toBeInTheDocument();
    expect(screen.getByText(/10월 30일 15:20까지 볼 수 있어요/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '공유할 이메일' })).toHaveValue('');
  });

  it('이메일 형식이 틀리면 검색하지 않고 안내한다', async () => {
    renderDialog();

    await searchEmail('hazel@gmail');

    expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식을 확인해주세요.');
    expect(searchShareUser).not.toHaveBeenCalled();
  });

  it('가입하지 않은 이메일이면 찾지 못했다고 알리고 추가할 수 없다', async () => {
    vi.mocked(searchShareUser).mockRejectedValue(apiError(404, 'USER_NOT_FOUND'));
    renderDialog();

    await searchEmail('nobody@gmail.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '이 이메일로 가입한 사용자를 찾지 못했어요.',
    );
    expect(screen.getByRole('button', { name: '추가하기' })).toBeDisabled();
  });

  it('이미 공유한 사람이면 등록 실패 이유를 보여준다', async () => {
    vi.mocked(searchShareUser).mockResolvedValue(hazel);
    vi.mocked(createTripShare).mockRejectedValue(apiError(409, 'TRIP_SHARE_ALREADY_EXISTS'));
    renderDialog();

    const user = await searchEmail('hazel@gmail.com');
    await screen.findByText('헤이즐');
    await user.click(screen.getByRole('button', { name: '추가하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 공유한 사람이에요.');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
