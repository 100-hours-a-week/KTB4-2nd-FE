'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/ui/button';

export function NotFoundPage() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace('/');
  };

  return (
    <main className="page-enter bg-surface text-brand mx-auto flex min-h-full w-full max-w-[430px] flex-col px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <Link
        href="/"
        aria-label="여담 홈으로 가기"
        className="focus-visible:outline-brand w-fit rounded text-lg font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        여담{' '}
        <span className="ml-1 text-xs font-semibold tracking-widest text-brand/60">YEODAM</span>
      </Link>

      <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <span
          aria-hidden="true"
          className="bg-surface-subtle grid size-24 place-items-center rounded-full text-3xl font-extrabold text-brand/40"
        >
          404
        </span>
        <h1 className="mt-6 text-2xl font-extrabold">페이지를 찾을 수 없어요</h1>
        <p className="text-muted mt-3 text-sm leading-6">
          주소가 잘못되었거나 페이지가 삭제되었어요.
          <br />
          홈으로 돌아가 여행 기록을 확인해보세요.
        </p>
        <div className="mt-8 flex w-full max-w-72 flex-col gap-3">
          <Link
            href="/"
            className="bg-brand hover:bg-brand-hover focus-visible:outline-brand inline-flex min-h-12 items-center justify-center rounded-control px-6 py-3 text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            홈으로 가기
          </Link>
          <Button variant="secondary" onClick={handleBack}>
            이전 페이지로 돌아가기
          </Button>
        </div>
      </section>
    </main>
  );
}
