import { isAxiosError } from 'axios';

function getErrorCode(error: unknown) {
  if (!isAxiosError<{ message?: unknown }>(error)) return undefined;
  const code = error.response?.data?.message;
  return typeof code === 'string' ? code : undefined;
}

export function getStoryUpdateErrorMessage(error: unknown) {
  const code = getErrorCode(error);

  if (code === 'INVALID_STORY_UPDATE') return '수정한 내용을 다시 확인해주세요.';
  if (code === 'ATTACHMENT_CANNOT_BE_REUSED') return '같은 사진을 두 번 넣을 수 없어요.';
  if (code === 'STORY_OR_ATTACHMENT_NOT_FOUND')
    return '스토리나 사진을 찾을 수 없어요. 새로고침 후 다시 시도해주세요.';
  return '스토리를 저장하지 못했어요. 다시 시도해주세요.';
}

export function getStoryTonePreviewErrorMessage(error: unknown) {
  const code = getErrorCode(error);

  if (code === 'STORY_TONE_PREVIEW_IN_PROGRESS')
    return '이미 글을 다시 쓰고 있어요. 잠시 후 다시 시도해주세요.';
  if (code === 'STORY_TONE_PREVIEW_UNAVAILABLE')
    return '지금은 AI를 사용할 수 없어 분위기를 바꿀 수 없어요.';
  if (code === 'STORY_TONE_PREVIEW_TIMEOUT')
    return '글을 다시 쓰는 데 시간이 너무 오래 걸렸어요. 다시 시도해주세요.';
  return '글 분위기를 바꾸지 못했어요. 다시 시도해주세요.';
}
