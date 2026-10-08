import type { TripDetail } from '@/features/tripDetail';

import type { TripStory, TripStoryResponse } from './types';

export function toTripStory(trip: TripDetail, response: TripStoryResponse): TripStory {
  return {
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    photoCount: trip.photoCount,
    days: [...response.days]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => ({
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
