'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

import { kakaoLoginQueries } from '@/queryFactory';
import { toast } from '@/shared/ui/toast';

export function KakaoLoginButton() {
  const loginMutation = useMutation({
    ...kakaoLoginQueries.start(),
    onError: () => {
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });
  const { reset } = loginMutation;

  useEffect(() => {
    const resetOnRestore = (event: PageTransitionEvent) => {
      if (event.persisted) reset();
    };
    window.addEventListener('pageshow', resetOnRestore);
    return () => window.removeEventListener('pageshow', resetOnRestore);
  }, [reset]);

  const isLoading = loginMutation.isPending;

  // 카카오 로그인 디자인 가이드: #FEE500 배경, 검은 심볼, 85% 검정 텍스트
  return (
    <button
      type="button"
      onClick={() => loginMutation.mutate()}
      disabled={isLoading}
      className="mt-7 inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#FEE500] text-base font-semibold text-black/85 transition-[filter,transform] duration-200 enabled:hover:brightness-95 enabled:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191919] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        '카카오 연결 중…'
      ) : (
        <>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="#000000">
            <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.8 6.6l-1 3.5c-.1.4.3.7.6.5l4.3-2.8c.4 0 .8.1 1.3.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3Z" />
          </svg>
          카카오로 시작하기
        </>
      )}
    </button>
  );
}
