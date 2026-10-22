import type { StoryFolderAccent } from './types';

/** 스토리 폴더 선택 카드에서 대표 사진이 없을 때 쓰는 배경 그라데이션입니다. */
export const STORY_FOLDER_ACCENT_GRADIENT: Record<StoryFolderAccent, string> = {
  coast: 'from-[#b5def4] to-[#306762]',
  sunset: 'from-[#ffd299] via-[#f9a393] to-[#1b2c51]',
  island: 'from-[#78cae8] via-[#a4e4ed] to-[#32495c]',
  night: 'from-[#33476c] to-[#14233c]',
  field: 'from-[#d6edda] to-[#71a48c]',
  sky: 'from-[#dce6fa] to-[#668cab]',
};
