'use client';

import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

import { getDevelopmentPlaceCandidates } from '../model/placeCandidateFixture';
import type { PlaceCandidate, TripCreateFormValues } from '../model/types';
import { TRIP_PLACE_MAX_COUNT, validateTripPlaces } from '../model/validation';
import { PlaceSearchField } from './placeSearchField';
import { TripCreateStepLayout } from './tripCreateStepLayout';

type TripLocationStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export function TripLocationStep({ onBack, onNext }: TripLocationStepProps) {
  const [query, setQuery] = useState('');
  const { control, trigger } = useFormContext<TripCreateFormValues>();
  const { field, fieldState } = useController({
    control,
    name: 'places',
    rules: { validate: validateTripPlaces },
  });
  const places = field.value;
  const candidates = getDevelopmentPlaceCandidates(query);

  const selectPlace = (place: PlaceCandidate) => {
    if (places.some((selected) => selected.regionCode === place.regionCode)) return;
    if (places.length >= TRIP_PLACE_MAX_COUNT) {
      toast.warning(`여행지는 최대 ${TRIP_PLACE_MAX_COUNT}개까지 선택할 수 있어요.`);
      return;
    }

    field.onChange([...places, place]);
    setQuery('');
  };

  const removePlace = (regionCode: string) => {
    field.onChange(places.filter((place) => place.regionCode !== regionCode));
  };

  const moveNext = async () => {
    if (await trigger('places')) onNext();
  };

  return (
    <TripCreateStepLayout
      title={
        <>
          어디로
          <br />
          다녀오셨나요?
        </>
      }
      description="여러 곳을 다녀오셨다면 해당 장소들을 모두 입력해주세요"
      onBack={onBack}
      footer={
        <Button className="w-full" disabled={places.length === 0} onClick={() => void moveNext()}>
          확인
        </Button>
      }
    >
      <PlaceSearchField
        query={query}
        candidates={candidates}
        selectedPlaces={places}
        onQueryChange={setQuery}
        onSelect={selectPlace}
      />

      {fieldState.error?.message && (
        <p role="alert" className="text-danger mt-3 text-sm">
          {fieldState.error.message}
        </p>
      )}

      {places.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2" aria-label="선택한 여행지">
          {places.map((place) => (
            <span
              key={place.regionCode}
              className="bg-brand inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white"
            >
              {place.regionName}
              <button
                type="button"
                aria-label={`${place.regionName} 삭제`}
                onClick={() => removePlace(place.regionCode)}
                className="cursor-pointer text-xl leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-muted mt-3 text-right text-xs">
        {places.length}/{TRIP_PLACE_MAX_COUNT}
      </p>
    </TripCreateStepLayout>
  );
}
