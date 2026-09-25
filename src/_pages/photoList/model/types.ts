export type PhotoAccent = 'coast' | 'night' | 'blossom' | 'sunset' | 'island' | 'desert';

export type PhotoListItem = {
  id: number;
  capturedAt: string;
  thumbnailUrl?: string | null;
  originalUrl?: string | null;
  accent: PhotoAccent;
  loadFailed?: boolean;
};
