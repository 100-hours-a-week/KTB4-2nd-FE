import type { SearchFolder } from '@/features/search';

export function placePhotosHref(
  folder: Pick<SearchFolder, 'tripId' | 'tripPlaceId'> & Partial<SearchFolder>,
) {
  const path = `/trips/${folder.tripId}/places/${folder.tripPlaceId}/photos`;
  const params = [
    folder.placeName && `place=${encodeURIComponent(folder.placeName)}`,
    folder.tripName && `trip=${encodeURIComponent(folder.tripName)}`,
  ].filter(Boolean);
  return params.length > 0 ? `${path}?${params.join('&')}` : path;
}
