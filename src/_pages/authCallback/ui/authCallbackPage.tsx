'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { exchangeLoginTicket } from '@/features/kakaoLogin';
import type { ApiErrorResponse } from '@/shared/api';

type FailureReason = 'expired' | 'unavailable';

const FAILURE_DESCRIPTION: Record<FailureReason, string> = {
  expired: '로그인 시간이 지났어요. 처음부터 다시 시도해주세요.',
  unavailable: '잠시 후 다시 시도해주세요.',
};

function getFailureReason(error: unknown): FailureReason {
  const code = axios.isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message
    : undefined;

  // loginTicket이 만료·재사용됐거나 로그인을 시작한 브라우저와 다르면 처음부터 다시 로그인해야 합니다.
  return code === 'LOGIN_TICKET_INVALID_OR_EXPIRED' ? 'expired' : 'unavailable';
}

export function AuthCallbackPage({ loginTicket }: { loginTicket?: string }) {
  const attempted = useRef(false);
  const [failure, setFailure] = useState<FailureReason | null>(loginTicket ? null : 'expired');

  useEffect(() => {
    // loginTicket은 한 번만 교환할 수 있어 Strict Mode의 중복 실행을 막습니다.
    if (!loginTicket || attempted.current) return;
    attempted.current = true;

    exchangeLoginTicket(loginTicket)
      .then((result) => {
        // 새 인증 쿠키를 서버 컴포넌트가 읽도록 전체 페이지를 다시 불러옵니다.
        window.location.replace(result.requiresNickname ? '/signup' : '/');
      })
      .catch((error: unknown) => setFailure(getFailureReason(error)));
  }, [loginTicket]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-brand text-2xl font-bold">
        {failure ? '로그인하지 못했어요' : '로그인하고 있어요'}
      </h1>
      {failure && (
        <>
          <p className="text-field-border text-base">{FAILURE_DESCRIPTION[failure]}</p>
          <Link
            href="/login"
            className="bg-brand rounded-control hover:bg-brand-hover inline-flex min-h-12 w-full max-w-72 items-center justify-center px-6 py-3 text-base font-semibold text-white"
          >
            다시 로그인하기
          </Link>
        </>
      )}
    </main>
  );
}
