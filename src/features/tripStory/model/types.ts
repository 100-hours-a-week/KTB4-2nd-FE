export const STORY_PHOTO_LIMIT = 30;

export type StoryPhoto = {
  id: string;
  attachmentId: number | null;
  placeName: string;
  situation: string;
  detailSummary?: string;
  sentence: string;
  thumbnailUrl: string | null;
};

export type StoryDay = {
  date: string;
  dayNumber: number;
  dayLabel?: string;
  placeName: string;
  photos: StoryPhoto[];
};

export type TripStory = {
  tripId: number;
  tripName: string;
  startDate: string;
  endDate: string;
  photoCount: number;
  summary?: string;
  days: StoryDay[];
};

export type TripStoryMood = 'PLAIN' | 'EMOTIONAL' | 'HUMOROUS' | 'CALM' | 'LITERARY';

export type TripStoryResponse = {
  storyId: number;
  tripId: number;
  /** 여행 주인일 때만 true이며, 스토리 수정은 주인만 할 수 있습니다. */
  userByMe: boolean;
  mood: TripStoryMood;
  storySummary: string;
  days: {
    date: string;
    dayLabel: string;
    blocks: {
      storyBlockId: number;
      orderNumber: number;
      tripPlaceId: number;
      tripAttachmentId: number;
      thumbnailUrl: string | null;
      detailSummary: string;
      memo: string | null;
    }[];
  }[];
};

export function getStoryPhotoLabel(photo: StoryPhoto) {
  return photo.detailSummary ?? [photo.placeName, photo.situation].filter(Boolean).join(' · ');
}
