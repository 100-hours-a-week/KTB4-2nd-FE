import { describe, expect, it } from 'vitest';

import { getTripEditNotice } from './tripEditNotice';

describe('getTripEditNotice', () => {
  it('바뀐 항목에 맞춰 알림 문구를 만든다', () => {
    const updated = (changes: Record<string, unknown>) => ({
      message: 'TRIP_UPDATED',
      data: { changes },
    });

    expect(getTripEditNotice(updated({ tripName: '부산' }))).toBe('여행 이름이 바뀌었어요.');
    expect(getTripEditNotice(updated({ startDate: 'a', endDate: 'b' }))).toBe(
      '여행 날짜가 바뀌었어요.',
    );
    expect(getTripEditNotice(updated({ tripName: '부산', regionCodes: [] }))).toBe(
      '여행 이름·장소가 바뀌었어요.',
    );
    expect(
      getTripEditNotice({ message: 'TRIP_PHOTOS_DELETED', data: { attachmentCount: 3 } }),
    ).toBe('사진 3장이 지워졌어요.');
    expect(getTripEditNotice({ message: 'PRESENCE_SNAPSHOT', data: {} })).toBeNull();
  });
});
