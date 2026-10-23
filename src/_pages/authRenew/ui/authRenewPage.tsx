'use client';

import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

import { refreshSession } from '@/shared/api/browser';
import { Button } from '@/shared/ui/button';

function getRenewedDestination(returnTo: string) {
  try {
    const destination = new URL(returnTo, window.location.origin);
    if (destination.origin !== window.location.origin) return '/?renewed=1';
    destination.searchParams.set('renewed', '1');
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/?renewed=1';
  }
}

export function AuthRenewPage({ returnTo = '/' }: { returnTo?: string }) {
  const attempted = useRef(false);
  const [failed, setFailed] = useState(false);

  const renew = useCallback(async () => {
    setFailed(false);

    try {
      await refreshSession();
      window.location.replace(getRenewedDestination(returnTo));
      return;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.replace('/login');
        return;
      }
    }

    setFailed(true);
  }, [returnTo]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    void renew();
  }, [renew]);

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-brand text-2xl font-bold">
        {failed ? '로그인 상태를 확인하지 못했어요' : '로그인 상태를 확인하고 있어요'}
      </h1>
      {failed && (
        <Button onClick={() => void renew()} className="min-h-12 w-full max-w-72">
          다시 시도
        </Button>
      )}
    </main>
  );
}
