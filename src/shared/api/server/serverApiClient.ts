import axios from 'axios';
import { cookies } from 'next/headers';

export async function createServerApiClient() {
  const cookieHeader = (await cookies()).toString();
  const configuredUrl = process.env.SERVER_API_BASE_URL?.trim();
  if (!configuredUrl) {
    throw new Error('SERVER_API_BASE_URL에 백엔드의 절대 API 주소를 설정해야 합니다.');
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error('SERVER_API_BASE_URL은 http 또는 https 절대 주소여야 합니다.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'SERVER_API_BASE_URL은 인증 정보·쿼리·해시가 없는 http 또는 https 주소여야 합니다.',
    );
  }

  return axios.create({
    baseURL: configuredUrl.replace(/\/+$/, ''),
    timeout: 100_000,
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });
}
