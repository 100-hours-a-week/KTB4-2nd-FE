/** 백엔드 목록 응답에는 처리 상태가 없어 현재는 항상 `ready`로 내려옵니다. */
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

/** 목록 API의 `sort` 파라미터 값입니다. */
export type TripListSort = 'LATEST' | 'OLDEST';

export type TripListFilter = {
  sort: TripListSort;
  /** `true`면 즐겨찾기한 여행을 먼저 내려줍니다. */
  favorite: boolean;
};

export function toTripListSort(sortOrder: TripSortOrder): TripListSort {
  return sortOrder === 'newest' ? 'LATEST' : 'OLDEST';
}
