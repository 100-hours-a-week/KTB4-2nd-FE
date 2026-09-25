'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { exchangeLoginTicket } from '@/features/kakaoLogin';
import type { ApiErrorResponse } from '@/shared/api';

type FailureReason = 'canceled' | 'expired' | 'unavailable';

const FAILURE_DESCRIPTION: Record<FailureReason, string> = {
  canceled: '로그인을 취소했어요.',
  expired: '로그인 시간이 지났어요. 처음부터 다시 시도해주세요.',
  unavailable: '잠시 후 다시 시도해주세요.',
};

function getRedirectFailureReason(errorCode?: string): FailureReason | null {
  if (!errorCode) return null;
  if (errorCode === 'KAKAO_LOGIN_CANCELED') return 'canceled';
  if (errorCode === 'OAUTH_STATE_INVALID_OR_EXPIRED') return 'expired';
  return 'unavailable';
}

function getFailureReason(error: unknown): FailureReason {
  const code = axios.isAxiosError<ApiErrorResponse>(error)
    ? error.response?.data?.message
    : undefined;

  return code === 'LOGIN_TICKET_INVALID_OR_EXPIRED' ? 'expired' : 'unavailable';
}

export function AuthCallbackPage({
  loginTicket,
  errorCode,
}: {
  loginTicket?: string;
  errorCode?: string;
}) {
  const attempted = useRef(false);
  const redirectFailure = getRedirectFailureReason(errorCode);
  const [exchangeFailure, setExchangeFailure] = useState<FailureReason | null>(
    loginTicket ? null : 'expired',
  );
  const failure = redirectFailure ?? exchangeFailure;

  useEffect(() => {
    if (errorCode || !loginTicket || attempted.current) return;
    attempted.current = true;

    exchangeLoginTicket(loginTicket)
      .then((result) => {
        window.location.replace(result.requiresNickname ? '/signup' : '/');
      })
      .catch((error: unknown) => setExchangeFailure(getFailureReason(error)));
  }, [errorCode, loginTicket]);

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
