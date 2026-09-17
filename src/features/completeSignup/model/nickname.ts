export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 10;

const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]+$/;

export function validateNickname(value: string): true | string {
  if (!value) return '닉네임을 입력해주세요.';

  if (!NICKNAME_PATTERN.test(value)) {
    return '공백과 특수문자는 쓸 수 없어요.';
  }

  if (value.length < NICKNAME_MIN_LENGTH) {
    return '2자 이상 입력해주세요.';
  }

  if (value.length > NICKNAME_MAX_LENGTH) {
    return '최대 10자까지 입력할 수 있어요.';
  }

  return true;
}
