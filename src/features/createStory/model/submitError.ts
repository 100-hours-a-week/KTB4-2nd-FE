import { isAxiosError } from 'axios';

import type { StoryCreateStep } from './types';

export type StoryCreateSubmitError =
  | { kind: 'alreadyExists'; message: string }
  | { kind: 'inProgress'; message: string }
  | { kind: 'retry'; message: string; step?: StoryCreateStep };

export const STORY_NOT_ALLOWED_MESSAGE =
  '사진을 정리하는 중이라 지금은 스토리를 만들 수 없어요. 정리가 끝난 뒤 다시 시도해주세요.';

export function isStoryNotAllowedError(error: unknown) {
  return isAxiosError(error) && error.response?.status === 409;
}

function getErrorCode(error: unknown) {
  if (!isAxiosError<{ message?: unknown }>(error)) return undefined;
  const code = error.response?.data?.message;
  return typeof code === 'string' ? code : undefined;
}

export function getStoryCreateSubmitError(error: unknown): StoryCreateSubmitError {
  const code = getErrorCode(error);

  if (code === 'STORY_ALREADY_EXISTS') {
    return { kind: 'alreadyExists', message: '이미 만들어진 스토리가 있어요.' };
  }
  if (code === 'STORY_GENERATION_IN_PROGRESS') {
    return { kind: 'inProgress', message: '이미 스토리를 만들고 있어요. 잠시 후 확인해주세요.' };
  }
  if (code === 'STORY_GENERATION_NOT_ALLOWED') {
    return { kind: 'retry', message: STORY_NOT_ALLOWED_MESSAGE };
  }
  if (code === 'INVALID_STORY_REQUEST') {
    return { kind: 'retry', message: '선택한 폴더를 다시 확인해주세요.', step: 'folder' };
  }
  if (code === 'STORY_GENERATION_FORBIDDEN') {
    return { kind: 'retry', message: '이 여행의 스토리를 만들 권한이 없어요.' };
  }

  return { kind: 'retry', message: '스토리 생성을 요청하지 못했어요. 다시 시도해주세요.' };
}
