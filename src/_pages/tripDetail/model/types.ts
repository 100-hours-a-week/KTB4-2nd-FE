export type TripPlaceFolder = {
  id: number;
  name: string;
  photoCount: number;
  thumbnailUrl?: string | null;
  accent: 'coast' | 'sunset' | 'island' | 'night' | 'field' | 'sky';
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
  folders: TripPlaceFolder[];
};

export type TripDetailViewState = 'ready' | 'loading' | 'error';
