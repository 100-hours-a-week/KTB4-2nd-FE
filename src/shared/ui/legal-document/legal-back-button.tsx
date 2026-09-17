'use client';

import { useRouter } from 'next/navigation';

export function LegalBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  };

  return (
    <button
      type="button"
      aria-label="이전 페이지로 이동"
      onClick={handleBack}
      className="hover:bg-brand/5 focus-visible:outline-brand inline-flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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
    </button>
  );
}
