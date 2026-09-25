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
  reviewCount: number;
};

export type TripDetailViewState = 'ready' | 'loading' | 'error';

export type TripDetailResult =
  | { status: 'ok'; trip: TripDetail }
  | { status: 'unauthorized' | 'notFound' | 'notReady' };
