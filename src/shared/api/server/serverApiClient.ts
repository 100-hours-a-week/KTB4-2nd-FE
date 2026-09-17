import axios from 'axios';
import { cookies } from 'next/headers';

import { API_BASE_URL } from '../config';

/**
 * 현재 요청의 쿠키를 백엔드로 전달하는 Server Component 전용 클라이언트를 생성합니다.
 * 사용자별 쿠키가 섞이지 않도록 요청마다 새 인스턴스를 만들어야 합니다.
 */
export async function createServerApiClient() {
  const cookieHeader = (await cookies()).toString();

  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 100_000,
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });
}
