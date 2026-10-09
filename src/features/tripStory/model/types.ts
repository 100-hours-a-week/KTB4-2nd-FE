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
  days: StoryDay[];
};

export type TripStoryResponse = {
  storyId: number;
  tripId: number;
  userByMe: boolean;
  mood: 'PLAIN' | 'EMOTIONAL' | 'HUMOROUS' | 'CALM' | 'LITERARY';
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
      memo: string;
    }[];
  }[];
};

export function getStoryPhotoLabel(photo: StoryPhoto) {
  return photo.detailSummary ?? [photo.placeName, photo.situation].filter(Boolean).join(' · ');
}
