import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TripCreateForm } from './tripCreateForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('TripCreateForm', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/trips/create?step=name');
  });

  it('단계를 이동해도 앞 단계에서 입력한 값을 유지한다', async () => {
    const user = userEvent.setup();
    render(<TripCreateForm initialStep="name" />);

    const nameInput = screen.getByPlaceholderText('여행 폴더 이름을 입력해주세요.');
    await user.type(nameInput, '제주 여행');
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByRole('heading', { name: /어디로/ })).toBeInTheDocument();
    expect(window.location.search).toBe('?step=location');

    act(() => {
      window.history.replaceState(null, '', '/trips/create?step=name');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(await screen.findByDisplayValue('제주 여행')).toBeInTheDocument();
  });
});
