import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';

export type RetryNoticeProps = {
  message: ReactNode;
  onRetry?: () => void;
  isRetrying?: boolean;
  icon?: ReactNode;
  className?: string;
};

export function RetryNotice({
  message,
  onRetry,
  isRetrying = false,
  icon,
  className = '',
}: RetryNoticeProps) {
  return (
    <div
      role="alert"
      className={`bg-brand rounded-row shadow-menu flex items-center gap-2 px-4 py-3 text-xs font-semibold text-white ${className}`}
    >
      {icon && (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 wrap-break-word">{message}</span>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          isLoading={isRetrying}
          loadingText="다시 시도 중…"
          onClick={onRetry}
          className="shrink-0 focus-visible:outline-white"
        >
          다시 시도
        </Button>
      )}
    </div>
  );
}
