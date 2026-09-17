import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Calendar } from './calendar';

describe('Calendar', () => {
  it('날짜를 선택한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar initialMonth="2026-09-01" onChange={onChange} />);

    await user.click(screen.getByRole('gridcell', { name: '2026년 9월 16일' }));

    expect(onChange).toHaveBeenCalledWith('2026-09-16');
    expect(screen.getByRole('gridcell', { name: '2026년 9월 16일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('이전 달과 다음 달로 이동한다', async () => {
    const user = userEvent.setup();
    render(<Calendar initialMonth="2026-09-01" />);

    expect(screen.getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음 달' }));
    expect(screen.getByRole('heading', { name: '2026년 10월' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '이전 달' }));
    expect(screen.getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument();
  });

  it('최소·최대 날짜와 지정된 날짜를 비활성화한다', () => {
    render(
      <Calendar
        initialMonth="2026-09-01"
        min="2026-09-10"
        max="2026-09-20"
        disabledDates={['2026-09-16']}
      />,
    );

    expect(screen.getByRole('gridcell', { name: '2026년 9월 9일' })).toBeDisabled();
    expect(screen.getByRole('gridcell', { name: '2026년 9월 16일' })).toBeDisabled();
    expect(screen.getByRole('gridcell', { name: '2026년 9월 21일' })).toBeDisabled();
    expect(screen.getByRole('gridcell', { name: '2026년 9월 15일' })).toBeEnabled();
  });

  it('외부 value를 선택 상태로 표시한다', () => {
    render(<Calendar value="2026-09-18" initialMonth="2026-09-01" />);

    expect(screen.getByRole('gridcell', { name: '2026년 9월 18일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
