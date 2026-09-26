export type PhotoAccent = 'coast' | 'night' | 'blossom' | 'sunset' | 'island' | 'desert';

export type PhotoListItem = {
  id: number;
  thumbnailUrl?: string | null;
  capturedAt?: string | null;
  accent: PhotoAccent;
  loadFailed?: boolean;
};

export type PhotoListViewState = 'ready' | 'loading' | 'error';

export const BULK_DOWNLOAD_LIMIT = 200;
