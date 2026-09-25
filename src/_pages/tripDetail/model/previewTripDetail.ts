import type { TripDetail } from './types';

/** TODO: 여행 상세 조회 API가 준비되면 실제 응답으로 교체합니다. */
export function createPreviewTripDetail(tripId: number): TripDetail {
  return {
    id: tripId,
    name: '제주도 가을 여행',
    locations: ['서귀포시', '제주시', '우도'],
    startDate: '2025-10-12',
    endDate: '2025-10-14',
    nights: 3,
    photoCount: 128,
    reviewCount: 9,
    folders: [
      { id: 1, name: '서귀포', photoCount: 35, accent: 'coast' },
      { id: 2, name: '성산일출봉', photoCount: 15, accent: 'sunset' },
      { id: 3, name: '우도', photoCount: 28, accent: 'island' },
      { id: 4, name: '제주시', photoCount: 42, accent: 'night' },
      { id: 5, name: '애월', photoCount: 5, accent: 'field' },
      { id: 6, name: '한림', photoCount: 3, accent: 'sky' },
    ],
  };
}
