'use client';

import { useEffect, useRef, useState } from 'react';

import { toast } from '@/shared/ui/toast';

const COPIED_FEEDBACK_MS = 2_000;

export function useCopyTripLink(tripId: number) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    const url = `${window.location.origin}/trips/${tripId}`;
    try {
      if (!navigator.clipboard) throw new Error('클립보드를 쓸 수 없어요.');
      await navigator.clipboard.writeText(url);
    } catch {
      toast.error('링크를 복사하지 못했어요.');
      return;
    }

    toast.success('링크를 복사했어요. 초대한 사람에게 보내주세요.');
    setCopied(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return { copied, copy };
}
