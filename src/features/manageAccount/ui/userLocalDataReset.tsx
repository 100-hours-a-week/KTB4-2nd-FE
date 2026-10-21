'use client';

import { useEffect } from 'react';

import { clearUserLocalData } from '../model/clearUserLocalData';

/**
 * 로그인 화면에 오면 로그아웃·세션 만료 등 이유와 상관없이 이전 사용자의 임시 데이터를 지웁니다.
 * 다른 계정으로 로그인해도 이전 작성 내용이 보이지 않게 합니다.
 */
export function UserLocalDataReset() {
  useEffect(() => {
    clearUserLocalData();
  }, []);

  return null;
}
