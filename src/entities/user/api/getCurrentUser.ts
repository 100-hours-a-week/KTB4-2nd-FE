import axios from 'axios';
import { cookies } from 'next/headers';
import { cache } from 'react';

import type { ApiResponse } from '@/shared/api';
import { createServerApiClient } from '@/shared/api/server';

export type CurrentUser = {
  userId: number;
  email: string;
  nickname: string;
  oauthProvider: string;
  oauthConnected: boolean;
};

export type CurrentUserResult =
  { status: 'authenticated'; user: CurrentUser } | { status: 'unauthorized' | 'notFound' };

/** 인증 여부는 쿠키 존재만으로 판단하지 않고 백엔드 세션으로 확인합니다. */
export const getCurrentUser = cache(async (): Promise<CurrentUserResult> => {
  if (!(await cookies()).has('accessToken')) {
    return { status: 'unauthorized' };
  }

  const client = await createServerApiClient();

  try {
    const { data } = await client.get<ApiResponse<CurrentUser>>('/users/me', {
      headers: { 'Cache-Control': 'no-store' },
    });

    return { status: 'authenticated', user: data.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) return { status: 'unauthorized' };
      if (error.response?.status === 404) return { status: 'notFound' };
    }

    // AxiosError에는 요청의 Cookie 헤더가 들어 있어 서버 로그에 그대로 남기지 않습니다.
    throw new Error('인증 상태 확인에 실패했습니다.');
  }
});
