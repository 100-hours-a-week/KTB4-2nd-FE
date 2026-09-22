import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTrip } from '../api/createTrip';
import { searchPlaces } from '../api/searchPlaces';
import { TripCreateForm } from './tripCreateForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('../api/searchPlaces', () => ({
  searchPlaces: vi.fn(),
}));

vi.mock('../api/createTrip', () => ({
  createTrip: vi.fn(),
}));

function renderTripCreateForm(initialStep: 'name' | 'location' = 'name') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TripCreateForm initialStep={initialStep} />
    </QueryClientProvider>,
  );
}

async function moveToLocationStep() {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('여행 폴더 이름을 입력해주세요.'), '제주 여행');
  await user.click(screen.getByRole('button', { name: '확인' }));
  await screen.findByRole('heading', { name: /어디로/ });
  return user;
}

describe('TripCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/trips/create?step=name');
  });

  it('단계를 이동해도 앞 단계에서 입력한 값을 유지한다', async () => {
    renderTripCreateForm();

    await moveToLocationStep();
    expect(window.location.search).toBe('?step=location');

    act(() => {
      window.history.replaceState(null, '', '/trips/create?step=name');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(await screen.findByDisplayValue('제주 여행')).toBeInTheDocument();
  });

  it('여행지 검색 결과를 선택하면 선택 목록에 추가한다', async () => {
    vi.mocked(searchPlaces).mockResolvedValue([
      { regionCode: '50110', regionName: '제주특별자치도 제주시' },
    ]);
    renderTripCreateForm();
    const user = await moveToLocationStep();

    await user.type(screen.getByRole('searchbox', { name: '여행지 검색' }), '제주');
    await user.click(await screen.findByRole('button', { name: '제주특별자치도 제주시' }));

    expect(searchPlaces).toHaveBeenCalledWith('제주');
    expect(screen.getByRole('button', { name: '제주특별자치도 제주시 삭제' })).toBeInTheDocument();
  });

  it('완성형 한글이 아닌 검색어는 요청하지 않는다', async () => {
    renderTripCreateForm();
    const user = await moveToLocationStep();

    await user.type(screen.getByRole('searchbox', { name: '여행지 검색' }), 'jeju');

    expect(await screen.findByText('띄어쓰기 없이 한글로 입력해주세요.')).toBeInTheDocument();
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it('이름 입력 후 엔터를 누르면 여행을 만들지 않고 다음 단계로 이동한다', async () => {
    const user = userEvent.setup();
    renderTripCreateForm();

    await user.type(
      screen.getByPlaceholderText('여행 폴더 이름을 입력해주세요.'),
      '제주 여행{Enter}',
    );

    expect(await screen.findByRole('heading', { name: /어디로/ })).toBeInTheDocument();
    expect(createTrip).not.toHaveBeenCalled();
  });

  it('여행지 검색창에서 엔터를 눌러도 여행을 만들지 않는다', async () => {
    renderTripCreateForm();
    const user = await moveToLocationStep();

    await user.type(screen.getByRole('searchbox', { name: '여행지 검색' }), '제주{Enter}');

    expect(screen.getByRole('heading', { name: /어디로/ })).toBeInTheDocument();
    expect(createTrip).not.toHaveBeenCalled();
  });
});
