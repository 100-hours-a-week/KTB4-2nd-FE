'use client';

import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { AlertCircleIcon } from '@/shared/ui/icons';

import type { AiUnavailableReason } from '../model/useAiReadyGuard';

const COPY: Record<AiUnavailableReason, { title: string; description: ReactNode }> = {
  starting: {
    title: 'AI를 준비하고 있어요',
    description: (
      <>
        AI 서버를 켜는 중이에요. 보통 3분 정도 걸려요.
        <br />
        잠시 후 다시 시도해주세요.
      </>
    ),
  },
  off: {
    title: '지금은 AI 이용 시간이 아니에요',
    description: (
      <>
        AI 기능은 정해진 시간에만 이용할 수 있어요.
        <br />
        이용 시간에 다시 시도해주세요.
      </>
    ),
  },
};

export function AiUnavailableDialog({
  reason,
  onClose,
}: {
  reason: AiUnavailableReason | null;
  onClose: () => void;
}) {
  const copy = COPY[reason ?? 'off'];

  return (
    <Dialog
      open={reason !== null}
      onClose={onClose}
      icon={<AlertCircleIcon size="19" />}
      title={copy.title}
      description={copy.description}
    >
      <Button onClick={onClose} className="w-full">
        확인
      </Button>
    </Dialog>
  );
}
