import { NicknameForm } from '@/features/completeSignup';
import { PageHeader } from '@/shared/ui/pageHeader';

export function SignupPage() {
  return (
    <main className="page-enter flex min-h-dvh flex-col px-6 pt-[max(12px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader backHref="/login" backLabel="이전 페이지로 이동" />

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
