'use client';

import { useMemo, useState } from 'react';

import { ChevronIcon } from '@/shared/ui/icons';

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
        {days.map((calendarDay, index) => {
          const isStart = calendarDay.date === value.startDate;
          const isEnd = calendarDay.date === value.endDate;
          const hasRange = Boolean(value.startDate && value.endDate) && !(isStart && isEnd);
          const isInRange =
            Boolean(value.startDate && value.endDate) &&
            calendarDay.date > value.startDate &&
            calendarDay.date < value.endDate;
          const disabled = isDisabled(calendarDay.date);
          const column = index % 7;
          const bandClassName = isInRange
            ? `inset-x-0 ${column === 0 ? 'rounded-l-full' : ''} ${column === 6 ? 'rounded-r-full' : ''}`
            : hasRange && isStart && column !== 6
              ? 'left-1/2 right-0'
              : hasRange && isEnd && column !== 0
                ? 'left-0 right-1/2'
                : null;

          return (
            <div key={calendarDay.date} className="relative flex h-10 items-center justify-center">
              {bandClassName && (
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 bg-[#e8eef6] ${bandClassName}`}
                />
              )}
              <button
                type="button"
                role="gridcell"
                aria-label={getDateLabel(calendarDay.date)}
                aria-selected={isStart || isEnd || isInRange}
                disabled={disabled}
                onClick={() => selectDate(calendarDay.date)}
                className={`relative inline-flex size-10 items-center justify-center rounded-full text-sm font-medium transition-colors
                  ${calendarDay.isCurrentMonth ? 'text-brand' : 'text-slate-300'}
                  ${isStart || isEnd ? 'bg-brand font-bold text-white' : 'hover:bg-brand/5'}
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
      <ChevronIcon
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        size="22"
        direction={direction}
      />
    </button>
  );
}
