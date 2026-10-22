import { isAxiosError } from 'axios';

export function getPhotoDeleteErrorMessage(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 409) {
    return '사진을 정리하는 중이라 지금은 삭제할 수 없어요. 잠시 후 다시 시도해주세요.';
  }
  return '사진을 삭제하지 못했어요.';
}
