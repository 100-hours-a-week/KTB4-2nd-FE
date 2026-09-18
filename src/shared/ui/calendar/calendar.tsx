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

export type CalendarProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (date: string) => void;
  min?: string;
  max?: string;
  disabledDates?: readonly string[];
  initialMonth?: string;
  label?: string;
  className?: string;
};

export function Calendar({
  value,
  defaultValue,
  onChange,
  min,
  max,
  disabledDates = [],
  initialMonth,
  label = '날짜 선택',
  className = '',
}: CalendarProps) {
  const today = useMemo(() => toDateString(new Date()), []);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedDate = value ?? internalValue;
  const [visibleMonth, setVisibleMonth] = useState(() =>
    parseDateString(initialMonth ?? selectedDate ?? today),
  );
  const disabledDateSet = useMemo(() => new Set(disabledDates), [disabledDates]);
  const days = getCalendarDays(visibleMonth);

  const isDisabled = (date: string) =>
    (min != null && date < min) || (max != null && date > max) || disabledDateSet.has(date);

  const selectDate = (date: string) => {
    if (isDisabled(date)) return;

    if (value === undefined) setInternalValue(date);
    onChange?.(date);

    const nextMonth = parseDateString(date);
    if (nextMonth.getMonth() !== visibleMonth.getMonth()) setVisibleMonth(nextMonth);
  };

  return (
    <section
      aria-label={label}
      className={`rounded-control bg-surface w-full border border-slate-200 p-4 shadow-sm ${className}`}
    >
      <header className="mb-5 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
          className="hover:bg-brand/5 focus-visible:outline-brand inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Chevron direction="left" />
        </button>

        <h2 aria-live="polite" className="text-brand text-lg font-bold">
          {getMonthLabel(visibleMonth)}
        </h2>

        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
          className="hover:bg-brand/5 focus-visible:outline-brand inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Chevron direction="right" />
        </button>
      </header>

      <div className="grid grid-cols-7" aria-hidden="true">
        {WEEKDAYS.map((weekday, index) => (
          <span
            key={weekday}
            className={`flex h-9 items-center justify-center text-xs font-semibold ${index === 0 ? 'text-danger' : index === 6 ? 'text-blue-600' : 'text-muted'}`}
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
          const selected = calendarDay.date === selectedDate;
          const isToday = calendarDay.date === today;
          const disabled = isDisabled(calendarDay.date);

          return (
            <button
              key={calendarDay.date}
              type="button"
              role="gridcell"
              aria-label={getDateLabel(calendarDay.date)}
              aria-selected={selected}
              aria-current={isToday ? 'date' : undefined}
              disabled={disabled}
              onClick={() => selectDate(calendarDay.date)}
              className={`relative mx-auto inline-flex size-10 items-center justify-center rounded-full text-sm font-medium transition-[background-color,color,transform] duration-150
                ${calendarDay.isCurrentMonth ? 'text-brand' : 'text-slate-300'}
                ${selected ? 'bg-brand text-white shadow-sm' : 'hover:bg-brand/5'}
                ${isToday && !selected ? 'font-bold after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-brand' : ''}
                ${disabled ? 'cursor-not-allowed opacity-30 hover:bg-transparent' : 'cursor-pointer active:scale-95'}
              `}
            >
              {calendarDay.day}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
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
      className="text-brand"
    >
      {direction === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}
