export type TripProcessingStatus = 'ready' | 'processing';

export type TripListItem = {
  id: number;
  name: string;
  locations: string[];
  startDate: string;
  endDate: string;
  nights: number;
  photoCount: number;
  favorite: boolean;
  processingStatus: TripProcessingStatus;
  thumbnailUrl?: string | null;
};

export type TripListViewState = 'ready' | 'loading' | 'error';
