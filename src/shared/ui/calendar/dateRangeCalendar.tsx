'use client';

import { useMemo, useState } from 'react';

import {
  addMonths,
  getCalendarDays,
  getDateLabel,
  getMonthLabel,
  parseDateString,
  toDateString,
  WEEKDAYS,
} from './calendarUtils';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type DateRangeCalendarProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  min?: string;
  max?: string;
  maxRangeDays?: number;
  onRangeLimitExceeded?: () => void;
  initialMonth?: string;
  label?: string;
  className?: string;
};

const EMPTY_END_DATE = '';

function differenceInDays(startDate: string, endDate: string) {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function DateRangeCalendar({
  value,
  onChange,
  min,
  max,
  maxRangeDays,
  onRangeLimitExceeded,
  initialMonth,
  label = '여행 기간 선택',
  className = '',
}: DateRangeCalendarProps) {
  const today = useMemo(() => toDateString(new Date()), []);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    parseDateString(initialMonth || value.startDate || today),
  );
  const days = getCalendarDays(visibleMonth);

  const isDisabled = (date: string) => (min != null && date < min) || (max != null && date > max);

  const selectDate = (date: string) => {
    if (isDisabled(date)) return;

    if (!value.startDate || value.endDate || date < value.startDate) {
      onChange({ startDate: date, endDate: EMPTY_END_DATE });
      return;
    }

    const selectedDays = differenceInDays(value.startDate, date) + 1;
    if (maxRangeDays != null && selectedDays > maxRangeDays) {
      onRangeLimitExceeded?.();
      return;
    }

    onChange({ startDate: value.startDate, endDate: date });
  };

  const canMoveToMonth = (amount: number) => {
    const target = addMonths(visibleMonth, amount);
    const firstDate = toDateString(new Date(target.getFullYear(), target.getMonth(), 1));
    const lastDate = toDateString(new Date(target.getFullYear(), target.getMonth() + 1, 0));
    return (min == null || lastDate >= min) && (max == null || firstDate <= max);
  };

  return (
    <section aria-label={label} className={`bg-surface w-full ${className}`}>
      <header className="mb-3 flex items-center justify-between border-y border-slate-200 py-1">
        <MonthButton
          direction="left"
          disabled={!canMoveToMonth(-1)}
          onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
        />
        <h2 aria-live="polite" className="text-brand text-lg font-bold">
          {getMonthLabel(visibleMonth)}
        </h2>
        <MonthButton
          direction="right"
          disabled={!canMoveToMonth(1)}
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
        />
      </header>

      <div className="grid grid-cols-7" aria-hidden="true">
        {WEEKDAYS.map((weekday, index) => (
          <span
            key={weekday}
            className={`flex h-9 items-center justify-center text-xs font-semibold ${
              index === 0 ? 'text-danger' : index === 6 ? 'text-blue-600' : 'text-muted'
            }`}
          >
            {weekday}
          </span>
        ))}
      </div>

      <div
        role="grid"
        aria-label={getMonthLabel(visibleMonth)}
        className="grid grid-cols-7 gap-y-1"
      >
        {days.map((calendarDay) => {
          const isStart = calendarDay.date === value.startDate;
          const isEnd = calendarDay.date === value.endDate;
          const isInRange =
            Boolean(value.startDate && value.endDate) &&
            calendarDay.date > value.startDate &&
            calendarDay.date < value.endDate;
          const disabled = isDisabled(calendarDay.date);

          return (
            <div
              key={calendarDay.date}
              className={`flex h-10 items-center justify-center ${isInRange ? 'bg-brand/10' : ''}`}
            >
              <button
                type="button"
                role="gridcell"
                aria-label={getDateLabel(calendarDay.date)}
                aria-selected={isStart || isEnd || isInRange}
                disabled={disabled}
                onClick={() => selectDate(calendarDay.date)}
                className={`inline-flex size-10 items-center justify-center rounded-full text-sm font-medium transition-colors
                  ${calendarDay.isCurrentMonth ? 'text-brand' : 'text-slate-300'}
                  ${isStart || isEnd ? 'bg-brand text-white' : 'hover:bg-brand/5'}
                  ${disabled ? 'cursor-not-allowed opacity-25 hover:bg-transparent' : 'cursor-pointer'}
                `}
              >
                {calendarDay.day}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MonthButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? '이전 달' : '다음 달'}
      disabled={disabled}
      onClick={onClick}
      className="focus-visible:outline-brand inline-flex size-10 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-25"
    >
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
      </svg>
    </button>
  );
}
