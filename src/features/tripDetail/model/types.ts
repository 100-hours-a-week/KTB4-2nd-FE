export type TripPlaceFolderAccent = 'coast' | 'sunset' | 'island' | 'night' | 'field' | 'sky';

export type TripPlaceFolder = {
  id: number;
  name: string;
  photoCount: number;
  thumbnailUrl?: string | null;
  accent: TripPlaceFolderAccent;
};

export type TripDetail = {
  id: number;
  name: string;
  locations: string[];
  startDate: string;
  endDate: string;
  nights: number;
  photoCount: number;
  /** 상세 조회 응답에 아직 없는 값이라 0으로 고정합니다. */
  reviewCount: number;
};

export type TripDetailViewState = 'ready' | 'loading' | 'error';

export type TripDetailResult =
  | { status: 'ok'; trip: TripDetail }
  /** notReady는 사진 정리가 끝나지 않아 상세를 볼 수 없는 상태(409)입니다. */
  | { status: 'unauthorized' | 'notFound' | 'notReady' };
