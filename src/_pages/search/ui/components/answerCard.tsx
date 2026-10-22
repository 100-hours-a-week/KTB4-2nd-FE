import { SparkleIcon } from '@/shared/ui/icons';

export function AnswerCard({
  answer,
  answerError,
}: {
  answer: string | null;
  answerError: string | null;
}) {
  if (!answer && !answerError) return null;

  return (
    <section
      aria-label="AI 답변"
      className="border-border-subtle bg-surface mt-4 shrink-0 rounded-[18px] border px-4 py-4 shadow-[0_2px_8px_rgba(2,23,48,0.03)]"
    >
      <h2 className="flex items-center gap-1.5 text-[13px] font-extrabold">
        <span className="text-[#3973b9]">
          <SparkleIcon fill="currentColor" size="15" />
        </span>
        AI 답변
      </h2>
      {answer ? (
        <p className="mt-2 text-[15px] leading-snug font-bold">{answer}</p>
      ) : (
        <p className="text-muted mt-2 text-xs">
          답변을 만들지 못했어요. 아래 검색 결과를 확인해보세요.
        </p>
      )}
    </section>
  );
}
