import type { TripDetail } from '@/features/tripDetail';

import type { TripStory, TripStoryResponse } from './types';

export function toTripStory(trip: TripDetail, response: TripStoryResponse): TripStory {
  return {
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    photoCount: trip.photoCount,
    days: response.days.map((day) => ({
      date: day.date,
      // 촬영일이 여행 시작일보다 앞서면 0·음수가 나오므로 첫째 날로 맞춥니다. 표시는 dayLabel을 우선합니다.
      dayNumber: Math.max(
        1,
        Math.round((Date.parse(day.date) - Date.parse(trip.startDate)) / 86_400_000) + 1,
      ),
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
