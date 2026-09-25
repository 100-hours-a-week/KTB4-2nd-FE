import type { PhotoAccent, PhotoListItem } from './types';

const ACCENTS: readonly PhotoAccent[] = ['coast', 'night', 'blossom', 'sunset', 'island', 'desert'];

/** TODO: 장소 폴더 사진 목록 API가 준비되면 실제 응답으로 교체합니다. */
export function createPreviewPhotos(count = 18): PhotoListItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    capturedAt: `2025-10-${String(12 + (index % 3)).padStart(2, '0')}`,
    accent: ACCENTS[index % ACCENTS.length],
    loadFailed: index === 7,
  }));
}
