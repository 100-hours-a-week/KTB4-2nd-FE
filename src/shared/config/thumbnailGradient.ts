/** 대표 사진이 없는 여행·폴더 썸네일 자리에 순서대로 돌아가며 쓰는 그라데이션입니다. */
export const THUMBNAIL_FALLBACK_GRADIENTS = [
  'from-[#273a63] via-[#4d638c] to-[#172743]',
  'from-[#f3d5a2] via-[#d87743] to-[#9d3f25]',
  'from-[#cfe5ed] via-[#8ebaa6] to-[#528b9e]',
] as const;

export function getThumbnailFallbackGradient(index: number) {
  return THUMBNAIL_FALLBACK_GRADIENTS[index % THUMBNAIL_FALLBACK_GRADIENTS.length];
}
