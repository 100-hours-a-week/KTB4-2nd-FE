'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { TripCreateFormValues } from '../model/types';
import { TRIP_NAME_MAX_LENGTH, validateTripName } from '../model/validation';
import { tripCreateButtonClassName, TripCreateStepLayout } from './tripCreateStepLayout';

type TripNameStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export function TripNameStep({ onBack, onNext }: TripNameStepProps) {
  const {
    control,
    register,
    trigger,
    formState: { errors },
  } = useFormContext<TripCreateFormValues>();
  const tripName = useWatch({ control, name: 'tripName' });

  const moveNext = async () => {
    if (await trigger('tripName')) onNext();
  };

  return (
    <TripCreateStepLayout
      step="name"
      title={
        <>
          여행 폴더 이름을
          <br />
          알려주세요
        </>
      }
      description="나중에 언제든 수정할 수 있어요"
      onBack={onBack}
      footer={
        <Button
          className={`w-full ${tripCreateButtonClassName}`}
          disabled={!tripName.trim()}
          onClick={() => void moveNext()}
        >
          다음
        </Button>
      }
    >
      <Input
        {...register('tripName', { validate: validateTripName })}
        autoFocus
        autoComplete="off"
        placeholder="예) 제주도 가을 여행"
        maxLength={TRIP_NAME_MAX_LENGTH}
        characterCount={tripName.length}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
          event.preventDefault();
          void moveNext();
        }}
        error={errors.tripName?.message}
      />
    </TripCreateStepLayout>
  );
}
