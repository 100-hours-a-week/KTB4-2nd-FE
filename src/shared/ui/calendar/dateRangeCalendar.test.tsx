import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DateRangeCalendar, type DateRange } from './dateRangeCalendar';

afterEach(() => {
  vi.useRealTimers();
});

function TestCalendar({ onLimit }: { onLimit?: () => void }) {
  const [value, setValue] = useState<DateRange>({ startDate: '', endDate: '' });
  return (
    <DateRangeCalendar
      value={value}
      onChange={setValue}
      initialMonth="2026-01-01"
      max="2026-12-31"
      maxRangeDays={92}
      onRangeLimitExceeded={onLimit}
    />
  );
}

describe('DateRangeCalendar', () => {
  it('선택값이 없으면 현재 달을 보여준다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-19T12:00:00'));

    render(<DateRangeCalendar value={{ startDate: '', endDate: '' }} onChange={() => undefined} />);

    expect(screen.getByRole('heading', { name: '2026년 9월' })).toBeInTheDocument();
  });

  it('시작일과 종료일을 차례로 선택한다', async () => {
    const user = userEvent.setup();
    render(<TestCalendar />);

    await user.click(screen.getByRole('gridcell', { name: '2026년 1월 10일' }));
    await user.click(screen.getByRole('gridcell', { name: '2026년 1월 12일' }));

    expect(screen.getByRole('gridcell', { name: '2026년 1월 10일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('gridcell', { name: '2026년 1월 11일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('gridcell', { name: '2026년 1월 12일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('시작일보다 이른 날짜를 누르면 시작일을 다시 정한다', async () => {
    const user = userEvent.setup();
    render(<TestCalendar />);

    await user.click(screen.getByRole('gridcell', { name: '2026년 1월 12일' }));
    await user.click(screen.getByRole('gridcell', { name: '2026년 1월 10일' }));

    expect(screen.getByRole('gridcell', { name: '2026년 1월 10일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('gridcell', { name: '2026년 1월 12일' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('92일을 넘는 종료일 선택을 거부한다', async () => {
    const user = userEvent.setup();
    const onLimit = vi.fn();
    render(<TestCalendar onLimit={onLimit} />);

    await user.click(screen.getByRole('gridcell', { name: '2026년 1월 1일' }));
    await user.click(screen.getByRole('button', { name: '다음 달' }));
    await user.click(screen.getByRole('button', { name: '다음 달' }));
    await user.click(screen.getByRole('button', { name: '다음 달' }));
    await user.click(screen.getByRole('gridcell', { name: '2026년 4월 3일' }));

    expect(onLimit).toHaveBeenCalledOnce();
    expect(screen.getByRole('gridcell', { name: '2026년 4월 3일' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
