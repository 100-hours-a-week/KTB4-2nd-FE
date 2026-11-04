import type { StorySourceFolder } from '@/features/createStory';
import type { TripDetail } from '@/features/tripDetail';
import type { TripStory } from '@/features/tripStory';

export const storyTrip: TripDetail = {
  id: 7,
  name: '제주도 가을 여행',
  locations: ['제주'],
  startDate: '2026-10-12',
  endDate: '2026-10-14',
  nights: 2,
  photoCount: 128,
  reviewCount: 0,
  hasStory: false,
};

const accents = ['coast', 'sunset', 'island', 'night', 'field', 'sky'] as const;

export const storyFolders: StorySourceFolder[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `샘플 장소 ${index + 1}`,
  photoCount: index === 11 ? 0 : 3 + index,
  thumbnailUrl: null,
  accent: accents[index % accents.length],
}));

// 외부 이미지나 원본 API 요청 없이 사진 상세보기를 확인하는 샘플입니다.
const thumbnailUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480"><rect width="480" height="480" fill="#dceaf0"/><circle cx="360" cy="100" r="45" fill="#ffd38c"/><path d="M0 300 130 180 320 400H0Z" fill="#86a995"/><path d="M80 480 320 230 480 380V480Z" fill="#587c73"/></svg>',
)}`;

export const tripStory: TripStory = {
  tripId: storyTrip.id,
  tripName: storyTrip.name,
  startDate: storyTrip.startDate,
  endDate: storyTrip.endDate,
  photoCount: storyTrip.photoCount,
  days: [
    {
      date: '2026-10-12',
      dayNumber: 1,
      placeName: '제주',
      photos: [
        {
          id: '1',
          attachmentId: 41,
          placeName: '샘플 해변',
          situation: '산책',
          sentence: '바람을 맞으며 천천히 해변을 걸었다.',
          thumbnailUrl,
        },
        {
          id: '2',
          attachmentId: 42,
          placeName: '샘플 산책길',
          situation: '가을 풍경',
          sentence: '함께 걸었던 길을 사진으로 남겼다.',
          thumbnailUrl,
        },
      ],
    },
  ],
};
