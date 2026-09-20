import type { PlaceCandidate } from './types';

const DEVELOPMENT_PLACE_CANDIDATES: PlaceCandidate[] = [
  { regionCode: '26290', regionName: '부산광역시 남구' },
  { regionCode: '26110', regionName: '부산광역시 중구' },
  { regionCode: '26350', regionName: '부산광역시 해운대구' },
  { regionCode: '41190', regionName: '경기도 부천시' },
  { regionCode: '41610', regionName: '경기도 광주시' },
  { regionCode: '50110', regionName: '제주특별자치도 제주시' },
  { regionCode: '50130', regionName: '제주특별자치도 서귀포시' },
  { regionCode: '42150', regionName: '강원특별자치도 속초시' },
];

export function getDevelopmentPlaceCandidates(query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || process.env.NODE_ENV !== 'development') return [];

  return DEVELOPMENT_PLACE_CANDIDATES.filter((candidate) =>
    candidate.regionName.includes(normalizedQuery),
  ).slice(0, 10);
}
