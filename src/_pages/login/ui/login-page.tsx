import Link from 'next/link';

import { KakaoLoginButton } from '@/features/kakao-login';

export function LoginPage() {
  return (
    <main className="page-enter flex min-h-dvh flex-col px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <section className="mt-auto pb-10">
        <h1 className="text-brand text-[32px] leading-[1.3] font-bold tracking-[-0.02em]">
          흩어진 여행 사진을
          <br />
          하나의 기록으로
        </h1>

        <p className="text-field-border mt-6 text-base leading-7">
          카카오 계정 하나면 충분해요.
          <br />
          별도 회원가입 없이 바로 시작할 수 있어요.
        </p>

        <KakaoLoginButton />

        <p className="text-muted mt-4 text-center text-xs leading-5">
          계속 진행하면 여담의{' '}
          <Link
            href="/terms/service"
            className="hover:text-brand underline underline-offset-2 transition-colors"
          >
            이용약관
          </Link>{' '}
          및{' '}
          <Link
            href="/terms/privacy"
            className="hover:text-brand underline underline-offset-2 transition-colors"
          >
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주돼요.
        </p>
      </section>
    </main>
  );
}
