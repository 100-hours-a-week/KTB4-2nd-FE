import type { PhotoAccent } from './types';

/** 썸네일이 없을 때 사진 자리를 채우는 그라데이션입니다. 사진을 보여주는 모든 화면이 같은 색을 씁니다. */
export const PHOTO_ACCENT_GRADIENT: Record<PhotoAccent, string> = {
  coast: 'from-[#cee7f0] via-[#70abc5] to-[#e6d6a5]',
  night: 'from-[#34476f] via-[#1d2c50] to-[#0e1a2e]',
  blossom: 'from-[#d9edf3] via-[#f4b9ca] to-[#8fb77b]',
  sunset: 'from-[#1d2945] via-[#293657] to-[#f1a456]',
  island: 'from-[#acd8ee] via-[#80b76d] to-[#407a3d]',
  desert: 'from-[#f4d9ad] via-[#d77b46] to-[#a94728]',
};
