'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { DateRangeCalendar, toDateString } from '@/shared/ui/calendar';
import { toast } from '@/shared/ui/toast';

import type { TripCreateFormValues } from '../../model/types';
import { TRIP_DATE_MAX_DAYS, validateTripDateRange } from '../../model/validation';
import { TripCreateStepLayout } from './tripCreateStepLayout';

type TripDateStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export function TripDateStep({ onBack, onNext }: TripDateStepProps) {
  const {
    control,
    clearErrors,
    register,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<TripCreateFormValues>();
  const [startDate, endDate] = useWatch({ control, name: ['startDate', 'endDate'] });
  const today = toDateString(new Date());

  const setRange = (range: { startDate: string; endDate: string }) => {
    clearErrors(['startDate', 'endDate']);
    setValue('startDate', range.startDate, { shouldDirty: true });
    setValue('endDate', range.endDate, { shouldDirty: true });
  };

  const moveNext = async () => {
    if (await trigger(['startDate', 'endDate'])) onNext();
  };

  const dateError = errors.startDate?.message ?? errors.endDate?.message;

  return (
    <TripCreateStepLayout
      step="date"
      title="여행은 언제였나요?"
      description="시작일과 종료일을 차례로 선택해주세요."
      onBack={onBack}
      footer={
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button
            variant="secondary"
            disabled={!startDate && !endDate}
            onClick={() => setRange({ startDate: '', endDate: '' })}
          >
            재설정
          </Button>
          <Button disabled={!startDate || !endDate} onClick={() => void moveNext()}>
            다음
          </Button>
        </div>
      }
    >
      <input
        type="hidden"
        {...register('startDate', {
          validate: (value) => validateTripDateRange(value, endDate),
        })}
      />
      <input
        type="hidden"
        {...register('endDate', {
          validate: (value) => validateTripDateRange(startDate, value),
        })}
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <DateValue label="시작일" value={startDate} active={!startDate} />
        <DateValue label="종료일" value={endDate} active={Boolean(startDate) && !endDate} />
      </div>
      {/* 기간 배지가 생기거나 사라져도 달력이 밀리지 않도록 자리를 유지합니다. */}
      <p className="mb-3 flex h-6 items-center justify-center text-xs font-semibold">
        {startDate && endDate && (
          <span className="text-brand inline-flex h-6 items-center rounded-full bg-[#eef3f9] px-2.5 leading-none whitespace-nowrap">
            {formatTripLength(startDate, endDate)}
          </span>
        )}
      </p>

      <DateRangeCalendar
        value={{ startDate, endDate }}
        onChange={setRange}
        max={today}
        maxRangeDays={TRIP_DATE_MAX_DAYS}
        onRangeLimitExceeded={() =>
          toast.warning(`여행 기간은 최대 ${TRIP_DATE_MAX_DAYS}일까지 선택할 수 있어요.`)
        }
      />

      {dateError && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {dateError}
        </p>
      )}
    </TripCreateStepLayout>
  );
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string) {
  const date = parseDate(value);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} (${WEEKDAYS[date.getDay()]})`;
}

function formatTripLength(startDate: string, endDate: string) {
  const days =
    Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86_400_000) + 1;
  return days <= 1 ? '당일치기' : `${days - 1}박 ${days}일`;
}

function DateValue({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors ${active ? 'border-brand ring-brand ring-1 ring-inset' : 'border-border-subtle'}`}
    >
      <p className="text-muted text-[11px] font-semibold">{label}</p>
      <p
        className={`mt-1 min-h-5 text-sm ${value ? 'text-brand font-bold' : 'text-muted/70 font-medium'}`}
      >
        {value ? formatDate(value) : '선택해주세요'}
      </p>
    </div>
  );
}
