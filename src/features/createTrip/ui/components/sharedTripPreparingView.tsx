'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { tripDetailQueries } from '@/queryFactory';
import { Button } from '@/shared/ui/button';

const RECHECK_INTERVAL_MS = 5_000;

export function SharedTripPreparingView({ tripId }: { tripId: number }) {
  const router = useRouter();
  const summary = useQuery({
    ...tripDetailQueries.summary(tripId),
    refetchInterval: RECHECK_INTERVAL_MS,
  });

  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (summary.isSuccess) router.replace(`/trips/${tripId}`);
  }, [router, summary.isSuccess, tripId]);

  async function recheck() {
    setChecking(true);
    try {
      await summary.refetch();
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="page-enter bg-surface text-brand mx-auto flex min-h-full w-full max-w-107.5 flex-col items-center justify-center px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="bg-surface-subtle size-16 animate-pulse rounded-full motion-reduce:animate-none"
      />
      <h1 className="mt-6 text-2xl font-extrabold">공유받은 여행을 정리하고 있어요</h1>
      <p role="status" className="text-muted mt-3 text-sm leading-6">
        여행을 만든 사람이 올린 사진을 장소별로 정리하는 중이에요.
        <br />
        정리가 끝나면 이 화면에서 바로 열어 드릴게요.
      </p>
      <div className="mt-8 flex w-full max-w-72 flex-col gap-3">
        <Button
          variant="secondary"
          onClick={() => void recheck()}
          isLoading={checking}
          loadingText="확인하는 중…"
        >
          지금 다시 확인하기
        </Button>
        <Link
          href="/mypage/invited"
          className="text-muted hover:text-brand focus-visible:outline-brand mx-auto rounded text-sm font-semibold focus-visible:outline-2"
        >
          초대받은 폴더로 가기
        </Link>
      </div>
    </main>
  );
}
