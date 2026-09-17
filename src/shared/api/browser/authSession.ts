'use client';

const ACCESS_TOKEN_KEY = 'accessToken';
const TOKEN_TYPE_KEY = 'tokenType';
const USER_ID_KEY = 'userId';

export type AuthSession = {
  accessToken: string;
  tokenType?: string;
  userId?: string | number;
};

export function getAuthorizationValue() {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) {
    return null;
  }

  const tokenType = localStorage.getItem(TOKEN_TYPE_KEY) ?? 'Bearer';
  return `${tokenType} ${accessToken}`;
}

export function setAuthSession({ accessToken, tokenType, userId }: AuthSession) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (tokenType) {
    localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
  }

  if (userId !== undefined) {
    localStorage.setItem(USER_ID_KEY, String(userId));
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(USER_ID_KEY);
}
