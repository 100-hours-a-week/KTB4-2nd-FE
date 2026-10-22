import type { TripPlaceFolderAccent } from './types';

/** 대표 사진이 없는 장소 폴더 카드의 배경 그라데이션입니다. */
export const PLACE_FOLDER_ACCENT_GRADIENT: Record<TripPlaceFolderAccent, string> = {
  coast: 'from-[#cce4ee] via-[#6eafc8] to-[#d8cda0]',
  sunset: 'from-[#1d2b49] via-[#314263] to-[#f5a85a]',
  island: 'from-[#acd6ed] via-[#70ad64] to-[#447c3e]',
  night: 'from-[#425783] via-[#23365c] to-[#101d34]',
  field: 'from-[#f3deb4] via-[#ce9956] to-[#788b56]',
  sky: 'from-[#badbea] via-[#96c5dc] to-[#e9d8a9]',
};
