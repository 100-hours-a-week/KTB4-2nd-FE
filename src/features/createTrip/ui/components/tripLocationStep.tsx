'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

import { createTripQueries } from '@/queryFactory';
import { Button } from '@/shared/ui/button';
import { CloseIcon } from '@/shared/ui/icons';
import { toast } from '@/shared/ui/toast';

import type { PlaceCandidate, TripCreateFormValues } from '../../model/types';
import {
  isSearchablePlaceQuery,
  TRIP_PLACE_MAX_COUNT,
  validateTripPlaces,
} from '../../model/validation';
import { PlaceSearchField } from './placeSearchField';
import { TripCreateStepLayout } from './tripCreateStepLayout';

const PLACE_SEARCH_DEBOUNCE_MS = 300;

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

  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(query.trim()), PLACE_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const placeSearch = useQuery({
    ...createTripQueries.placeSearch(searchQuery),
    enabled: isSearchablePlaceQuery(searchQuery),
    placeholderData: keepPreviousData,
  });
  const isSearchable = isSearchablePlaceQuery(query.trim());

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
      step="location"
      title={
        <>
          어디로
          <br />
          다녀오셨나요?
        </>
      }
      description="여러 곳을 다녀오셨다면 모두 추가해주세요."
      onBack={onBack}
      contentScrollable={false}
      footer={
        <Button className="w-full" disabled={places.length === 0} onClick={() => void moveNext()}>
          다음
        </Button>
      }
    >
      {/* 검색 결과 목록만 남은 높이 안에서 스크롤되고, 선택한 여행지는 항상 보이게 둡니다. */}
      <div className="flex h-full min-h-0 flex-col pb-6">
        <PlaceSearchField
          query={query}
          candidates={isSearchable ? (placeSearch.data ?? []) : []}
          status={
            !isSearchable
              ? 'idle'
              : placeSearch.isError
                ? 'error'
                : placeSearch.data === undefined
                  ? 'loading'
                  : 'success'
          }
          selectedPlaces={places}
          onQueryChange={setQuery}
          onSelect={selectPlace}
        />

        {fieldState.error?.message && (
          <p role="alert" className="text-danger mt-3 shrink-0 text-sm">
            {fieldState.error.message}
          </p>
        )}

        <div className="mt-6 flex shrink-0 items-center justify-between">
          <p className="text-muted text-xs font-semibold">선택한 여행지</p>
          <p
            aria-label="선택한 여행지 수"
            className="text-muted inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#eef3f9] px-2.5 text-xs leading-none whitespace-nowrap tabular-nums"
          >
            <strong className="text-brand">{places.length}</strong> / {TRIP_PLACE_MAX_COUNT}
          </p>
        </div>

        {places.length > 0 ? (
          <ul
            className="mt-3 flex max-h-32 shrink-0 flex-wrap gap-2 overflow-y-auto overscroll-contain"
            aria-label="선택한 여행지"
          >
            {places.map((place) => (
              <li
                key={place.regionCode}
                className="bg-surface-subtle border-border-subtle text-brand inline-flex max-w-full min-h-9 items-center gap-1 rounded-full border pr-1 pl-3.5 text-[13px] font-semibold"
              >
                <span className="min-w-0 truncate">{place.regionName}</span>
                <button
                  type="button"
                  aria-label={`${place.regionName} 삭제`}
                  onClick={() => removePlace(place.regionCode)}
                  className="text-muted hover:text-brand focus-visible:outline-brand grid size-7 cursor-pointer place-items-center rounded-full transition-colors hover:bg-slate-200 focus-visible:outline-2"
                >
                  <CloseIcon strokeWidth="2.4" strokeLinecap="round" size="12" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted/80 border-border-subtle mt-3 shrink-0 rounded-2xl border border-dashed px-4 py-5 text-center text-[13px]">
            검색해서 다녀온 곳을 추가해주세요.
          </p>
        )}
      </div>
    </TripCreateStepLayout>
  );
}
