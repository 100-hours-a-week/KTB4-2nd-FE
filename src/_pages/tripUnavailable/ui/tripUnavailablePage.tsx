'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useLogout } from '@/features/manageAccount';
import { saveLoginReturnPath } from '@/shared/lib/url';
import { Button } from '@/shared/ui/button';
import { ShieldIcon } from '@/shared/ui/icons';

const REASONS = [
  '아직 초대받지 않았다면 링크를 보낸 사람에게 이메일로 초대해 달라고 요청해주세요.',
  '다른 계정으로 초대받았다면 그 계정으로 다시 로그인해주세요.',
  '공유 기간이 끝났거나 여행이 삭제되었을 수도 있어요.',
];

/**
 * 여행 화면에서 백엔드가 404를 줄 때 보여줍니다.
 * 백엔드는 초대받지 않음, 공유 만료, 삭제된 여행, 없는 여행을 모두 같은 404로 주므로 가능한 이유를 함께 안내합니다.
 */
export function TripUnavailablePage({ email }: { email: string | null }) {
  const pathname = usePathname();
  const logout = useLogout();

  function loginWithAnotherAccount() {
    // 다른 계정으로 로그인한 뒤 이 링크로 바로 돌아오게 합니다.
    saveLoginReturnPath(pathname);
    logout.mutate();
  }

  return (
    <main className="page-enter bg-surface text-brand mx-auto flex min-h-full w-full max-w-[430px] flex-col px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <Link
        href="/"
        aria-label="여담 홈으로 가기"
        className="focus-visible:outline-brand w-fit rounded text-lg font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        여담{' '}
        <span className="text-brand/60 ml-1 text-xs font-semibold tracking-widest">YEODAM</span>
      </Link>

      <section className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <span
          aria-hidden="true"
          className="bg-surface-subtle text-brand/40 grid size-24 place-items-center rounded-full"
        >
          <ShieldIcon size="40" />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold">이 여행을 볼 수 없어요</h1>
        <p className="text-muted mt-3 text-sm leading-6">초대받은 사람만 볼 수 있는 여행이에요.</p>

        <ul className="bg-surface-subtle mt-6 w-full space-y-2 rounded-[14px] p-4 text-left text-[13px] leading-5">
          {REASONS.map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden="true" className="text-muted">
                •
              </span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        {email && (
          <p className="text-muted mt-4 text-xs">
            지금 로그인한 계정 <span className="text-brand font-semibold">{email}</span>
          </p>
        )}

        <div className="mt-8 flex w-full max-w-72 flex-col gap-3">
          <Link
            href="/"
            className="bg-brand hover:bg-brand-hover focus-visible:outline-brand rounded-control inline-flex min-h-12 items-center justify-center px-6 py-3 text-base font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            홈으로 가기
          </Link>
          <Button
            variant="secondary"
            onClick={loginWithAnotherAccount}
            isLoading={logout.isPending}
          >
            다른 계정으로 로그인
          </Button>
        </div>
      </section>
    </main>
  );
}
