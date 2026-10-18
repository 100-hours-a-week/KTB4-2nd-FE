import type { SearchFolder } from '@/features/search';

/** 장소 폴더 사진 목록으로 이동합니다. 이름을 알면 사진 목록 화면 제목에 쓰도록 함께 넘깁니다. */
export function placePhotosHref(
  folder: Pick<SearchFolder, 'tripId' | 'tripPlaceId'> & Partial<SearchFolder>,
) {
  const path = `/trips/${folder.tripId}/places/${folder.tripPlaceId}/photos`;
  if (!folder.placeName || !folder.tripName) return path;
  return `${path}?place=${encodeURIComponent(folder.placeName)}&trip=${encodeURIComponent(folder.tripName)}`;
}
