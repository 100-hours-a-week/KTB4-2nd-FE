'use client';

import Link from 'next/link';

import { Button } from '../button';

export function PageError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <div>
        <h1 className="text-brand text-2xl font-bold">화면을 불러오지 못했어요</h1>
        <p className="text-muted mt-2">일시적인 문제일 수 있어요. 잠시 후 다시 시도해주세요.</p>
      </div>
      <div className="flex w-full max-w-72 flex-col gap-2">
        <Button onClick={reset} className="min-h-12 w-full">
          다시 시도
        </Button>
        <Link
          href="/"
          className="text-muted hover:text-brand inline-flex min-h-11 items-center justify-center text-sm font-semibold"
        >
          홈으로 가기
        </Link>
      </div>
    </main>
  );
}
