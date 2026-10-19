'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { aiStatusQueries } from '@/queryFactory';

import { toAiAvailability, type AiAvailability } from './aiAvailability';

export type AiUnavailableReason = Exclude<AiAvailability, 'ready'>;

/**
 * AI를 쓰는 요청 직전에 GPU 서버 상태를 확인합니다.
 * 준비되지 않았으면 요청 대신 안내 사유를 남기고, 상태 확인 자체가 실패하면
 * 사용자를 막지 않고 원래 요청을 진행해 그 API의 오류 안내를 따릅니다.
 */
export function useAiReadyGuard() {
  const queryClient = useQueryClient();
  const [unavailableReason, setUnavailableReason] = useState<AiUnavailableReason | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runWhenAiReady = useCallback(
    async (action: () => void) => {
      setIsChecking(true);
      let availability: AiAvailability = 'ready';
      try {
        availability = toAiAvailability(await queryClient.fetchQuery(aiStatusQueries.status()));
      } catch {
        // 상태 확인에 실패하면 막지 않습니다.
      } finally {
        setIsChecking(false);
      }

      if (availability === 'ready') action();
      else setUnavailableReason(availability);
    },
    [queryClient],
  );

  const closeUnavailableDialog = useCallback(() => setUnavailableReason(null), []);

  return { runWhenAiReady, isChecking, unavailableReason, closeUnavailableDialog };
}
