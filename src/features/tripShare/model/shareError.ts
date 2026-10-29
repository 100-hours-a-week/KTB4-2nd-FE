import { isAxiosError } from 'axios';

function getErrorCode(error: unknown) {
  if (!isAxiosError<{ message?: unknown }>(error)) return undefined;
  const code = error.response?.data?.message;
  return typeof code === 'string' ? code : undefined;
}

export function getShareSearchErrorMessage(error: unknown) {
  const code = getErrorCode(error);

  if (code === 'USER_NOT_FOUND') return '이 이메일로 가입한 사용자를 찾지 못했어요.';
  if (code === 'INVALID_EMAIL_FORMAT') return '이메일 형식을 확인해주세요.';

  return '사용자를 찾지 못했어요. 잠시 후 다시 시도해주세요.';
}

export function getShareCreateErrorMessage(error: unknown) {
  const code = getErrorCode(error);

  if (code === 'TRIP_SHARE_ALREADY_EXISTS') return '이미 공유한 사람이에요.';
  if (code === 'TRIP_SHARE_NOT_AVAILABLE') return '사진 정리가 끝난 뒤에 공유할 수 있어요.';
  if (code === 'TRIP_SHARE_CREATE_FORBIDDEN') return '여행을 만든 사람만 공유할 수 있어요.';
  if (code === 'TRIP_NOT_FOUND') return '여행을 찾을 수 없어요.';
  if (code === 'INVALID_TRIP_SHARE_REQUEST') return '공유할 수 없는 사용자예요.';

  return '공유하지 못했어요. 잠시 후 다시 시도해주세요.';
}
