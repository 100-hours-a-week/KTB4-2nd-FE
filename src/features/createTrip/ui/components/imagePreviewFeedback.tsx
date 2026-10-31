import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

type ImagePreviewFeedbackProps = {
  fileName: string;
  kind: 'loading' | 'network' | 'module' | 'conversion';
  disabled?: boolean;
  delayMs?: number;
  onRetry: () => void;
};

const messages = {
  network: { full: '인터넷 연결을 기다리고 있어요', short: '연결 대기' },
  module: { full: '미리보기 준비에 실패했어요', short: '준비 실패' },
  conversion: { full: '미리보기 불가', short: '미리보기 불가' },
};

export function ImagePreviewFeedback({
  fileName,
  kind,
  disabled = false,
  delayMs,
  onRetry,
}: ImagePreviewFeedbackProps) {
  if (kind === 'loading') {
    return (
      <div
        role="status"
        aria-label={`${fileName} 미리보기 준비 중`}
        aria-busy="true"
        className="size-full"
      >
        <Skeleton animation="breathe" delayMs={delayMs} className="size-full rounded-none" />
      </div>
    );
  }
  const message = messages[kind];
  return (
    <div
      title={`${fileName}: ${message.full}`}
      className="text-muted flex size-full flex-col items-center justify-center px-1 pt-8 text-center text-[10px]"
    >
      <span role="status" aria-label={message.full} className="leading-none">
        {message.short}
      </span>
      {message.full !== message.short && <span className="sr-only">{message.full}</span>}
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        aria-label={`${fileName} 미리보기 다시 시도`}
        onClick={onRetry}
        className="mt-1 w-full"
      >
        재시도
      </Button>
    </div>
  );
}
