import Link from 'next/link';

import { NicknameForm } from '@/features/completeSignup';

export function SignupPage() {
  return (
    <main className="page-enter flex min-h-dvh flex-col px-6 pt-[max(12px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <header className="flex h-12 items-center">
        <Link
          href="/login"
          aria-label="이전 페이지로 이동"
          className="hover:bg-brand/5 focus-visible:outline-brand -ml-2 inline-flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <svg
            aria-hidden="true"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      </header>

      <section className="flex flex-1 flex-col pt-14">
        <div>
          <h1 className="text-brand text-[32px] leading-[1.3] font-bold tracking-[-0.02em]">
            닉네임을
            <br />
            알려주세요
          </h1>
          <p className="text-field-border mt-5 text-base">나중에 언제든 수정할 수 있어요.</p>
        </div>

        <NicknameForm />
      </section>
    </main>
  );
}
