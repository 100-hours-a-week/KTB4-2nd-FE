'use client';

import { SessionError } from '@/shared/ui/sessionError/sessionError';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SessionError reset={reset} />;
}
