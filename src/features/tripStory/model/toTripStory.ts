import type { TripDetail } from '@/features/tripDetail';

import type { TripStory, TripStoryResponse } from './types';

export function toTripStory(trip: TripDetail, response: TripStoryResponse): TripStory {
  return {
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    photoCount: trip.photoCount,
    // 백엔드가 블록 순서대로 날짜·dayLabel이 바뀔 때마다 day를 나눠 주므로 순서를 그대로 씁니다.
    days: response.days.map((day) => ({
      date: day.date,
      dayNumber: Math.round((Date.parse(day.date) - Date.parse(trip.startDate)) / 86_400_000) + 1,
      dayLabel: day.dayLabel,
      placeName: '',
      photos: [...day.blocks]
        .sort((a, b) => a.orderNumber - b.orderNumber)
        .map((block) => ({
          id: String(block.storyBlockId),
          attachmentId: block.tripAttachmentId,
          placeName: '',
          situation: '',
          detailSummary: block.detailSummary,
          sentence: block.memo,
          thumbnailUrl: block.thumbnailUrl,
        })),
    })),
  };
}
