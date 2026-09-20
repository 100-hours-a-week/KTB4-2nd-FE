'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { DateRangeCalendar, toDateString } from '@/shared/ui/calendar';
import { toast } from '@/shared/ui/toast';

import type { TripCreateFormValues } from '../model/types';
import { TRIP_DATE_MAX_DAYS, validateTripDateRange } from '../model/validation';
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
      title="여행은 언제 였나요?"
      description="시작일과 종료일을 선택해주세요."
      onBack={onBack}
      footer={
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button
            className="border-brand bg-surface text-black! hover:bg-brand/5 hover:text-white! border-2"
            disabled={!startDate && !endDate}
            onClick={() => setRange({ startDate: '', endDate: '' })}
          >
            재설정
          </Button>
          <Button disabled={!startDate || !endDate} onClick={() => void moveNext()}>
            확인
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

      <div className="border-field-border mb-5 grid grid-cols-2 gap-7 rounded-lg border px-4 py-4">
        <DateValue label="시작일" value={startDate} />
        <DateValue label="종료일" value={endDate} />
      </div>

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

function DateValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-field-border border-b pb-2">
      <p className="text-muted text-xs">{label}</p>
      <p className="text-brand mt-1 min-h-5 text-sm font-semibold">{value || '선택해주세요'}</p>
    </div>
  );
}
