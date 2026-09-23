import { describe, expect, it } from 'vitest';

import { TRIP_CREATE_DEFAULT_VALUES } from './types';
import {
  getAccessibleTripCreateStep,
  validateTripDateRange,
  validateTripName,
  validateTripPlaces,
} from './validation';

describe('여행 생성 입력 검증', () => {
  it('공백뿐인 이름과 10자를 넘는 이름을 거부한다', () => {
    expect(validateTripName('   ')).toBe('여행 폴더 이름을 입력해주세요.');
    expect(validateTripName('12345678901')).toBe('여행 폴더 이름은 10자까지 입력할 수 있어요.');
    expect(validateTripName('제주 여행')).toBe(true);
  });

  it('여행지는 한 곳 이상 열 곳 이하로 선택한다', () => {
    expect(validateTripPlaces([])).toBe('여행지를 한 곳 이상 선택해주세요.');
    expect(
      validateTripPlaces(
        Array.from({ length: 11 }, (_, index) => ({
          regionCode: String(index),
          regionName: `지역 ${index}`,
        })),
      ),
    ).toBe('여행지는 최대 10개까지 선택할 수 있어요.');
  });

  it('여행 기간은 양 끝 날짜를 포함해 최대 92일이다', () => {
    expect(validateTripDateRange('2026-01-01', '2026-04-02')).toBe(true);
    expect(validateTripDateRange('2026-01-01', '2026-04-03')).toBe(
      '여행 기간은 최대 92일까지 선택할 수 있어요.',
    );
  });

  it('앞 단계 값이 없으면 요청한 단계보다 먼저 필요한 단계로 돌아간다', () => {
    expect(getAccessibleTripCreateStep('images', TRIP_CREATE_DEFAULT_VALUES)).toBe('name');
    expect(
      getAccessibleTripCreateStep('images', {
        ...TRIP_CREATE_DEFAULT_VALUES,
        tripName: '제주 여행',
        places: [],
      }),
    ).toBe('location');
  });
});
