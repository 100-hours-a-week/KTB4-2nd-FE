import { beforeEach, describe, expect, it } from 'vitest';

import { readTripCreateDraft } from './tripCreateDraft';

const KEY = 'trip-create-draft-v1';

function saveRaw(startDate: string, endDate: string) {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({
      tripName: '제주 여행',
      places: [{ regionCode: '50110', regionName: '제주시' }],
      startDate,
      endDate,
    }),
  );
}

describe('readTripCreateDraft 날짜 복원', () => {
  beforeEach(() => window.localStorage.clear());

  it('올바른 날짜는 그대로 복원한다', () => {
    saveRaw('2026-10-01', '2026-10-03');
    expect(readTripCreateDraft()).toMatchObject({ startDate: '2026-10-01', endDate: '2026-10-03' });
  });

  it('시작일만 고른 중간 상태도 복원한다', () => {
    saveRaw('2026-10-01', '');
    expect(readTripCreateDraft()).toMatchObject({ startDate: '2026-10-01', endDate: '' });
  });

  it.each([
    ['not-a-date', '2026-10-03'],
    ['2026-02-30', '2026-03-01'],
    ['2026-10-05', '2026-10-01'],
    ['', '2026-10-01'],
    ['2026/10/01', '2026/10/03'],
  ])('깨진 날짜(%s ~ %s)는 날짜만 비우고 나머지 입력은 남긴다', (startDate, endDate) => {
    saveRaw(startDate, endDate);
    expect(readTripCreateDraft()).toMatchObject({
      tripName: '제주 여행',
      startDate: '',
      endDate: '',
    });
  });
});
