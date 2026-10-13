import { describe, expect, it } from 'vitest';

import type { TripDetail } from '@/features/tripDetail';

import { toTripStory } from './toTripStory';
import type { TripStoryResponse } from './types';

const trip: TripDetail = {
  id: 7,
  name: '서울 여행',
  locations: ['서울'],
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  nights: 2,
  photoCount: 8,
  reviewCount: 0,
  hasStory: false,
};

function block(storyBlockId: number, orderNumber: number) {
  return {
    storyBlockId,
    orderNumber,
    tripPlaceId: 1,
    tripAttachmentId: storyBlockId * 10,
    thumbnailUrl: null,
    detailSummary: `요약 ${storyBlockId}`,
    memo: `문장 ${storyBlockId}`,
  };
}

describe('toTripStory', () => {
  it('같은 날짜가 dayLabel로 나뉘어도 백엔드가 준 이야기 순서를 유지한다', () => {
    const response: TripStoryResponse = {
      storyId: 1,
      tripId: 7,
      userByMe: true,
      mood: 'CALM',
      storySummary: '서울의 가을',
      days: [
        { date: '2026-10-13', dayLabel: '둘째 날 · 남산', blocks: [block(1, 1)] },
        { date: '2026-10-12', dayLabel: '첫째 날 · 성수', blocks: [block(2, 2)] },
        { date: '2026-10-12', dayLabel: '첫째 날 · 서울숲', blocks: [block(3, 3)] },
      ],
    };

    const story = toTripStory(trip, response);

    expect(story.days.map((day) => [day.date, day.dayLabel, day.dayNumber])).toEqual([
      ['2026-10-13', '둘째 날 · 남산', 2],
      ['2026-10-12', '첫째 날 · 성수', 1],
      ['2026-10-12', '첫째 날 · 서울숲', 1],
    ]);
    expect(story.days.flatMap((day) => day.photos.map((photo) => photo.attachmentId))).toEqual([
      10, 20, 30,
    ]);
  });
});
