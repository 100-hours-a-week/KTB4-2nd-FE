'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { kakaoLoginQueries } from '@/queryFactory';
import { Button } from '@/shared/ui/button';
import { toast } from '@/shared/ui/toast';

export function KakaoLoginButton() {
  const router = useRouter();
  const loginMutation = useMutation({
    ...kakaoLoginQueries.start(),
    onSuccess: () => {
      router.push('/signup');
    },
    onError: () => {
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });

  return (
    <Button
      onClick={() => loginMutation.mutate()}
      isLoading={loginMutation.isPending}
      loadingText="카카오 연결 중…"
      className="mt-8 min-h-14 w-full gap-2 text-base"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.8 6.6l-1 3.5c-.1.4.3.7.6.5l4.3-2.8c.4 0 .8.1 1.3.1 5.5 0 10-3.5 10-7.9S17.5 3 12 3Z" />
      </svg>
      카카오로 시작하기
    </Button>
  );
}
