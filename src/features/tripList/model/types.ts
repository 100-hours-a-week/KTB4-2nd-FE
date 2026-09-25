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

export type TripSortOrder = 'newest' | 'oldest';

export type TripListSort = 'LATEST' | 'OLDEST';

export type TripListFilter = {
  sort: TripListSort;
  favorite: boolean;
};

export function toTripListSort(sortOrder: TripSortOrder): TripListSort {
  return sortOrder === 'newest' ? 'LATEST' : 'OLDEST';
}
