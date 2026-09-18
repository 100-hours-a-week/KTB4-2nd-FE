'use client';

import { Button } from '../button';

export function SessionError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="text-brand text-2xl font-bold">로그인 상태를 확인하지 못했어요</h1>
      <p className="text-muted">잠시 후 다시 시도해주세요.</p>
      <Button onClick={reset} className="min-h-12 w-full max-w-72">
        다시 시도
      </Button>
    </main>
  );
}
