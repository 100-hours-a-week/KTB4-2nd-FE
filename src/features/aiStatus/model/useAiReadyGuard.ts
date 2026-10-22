'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { aiStatusQueries } from '@/queryFactory';

import { toAiAvailability, type AiAvailability } from './aiAvailability';

export type AiUnavailableReason = Exclude<AiAvailability, 'ready'>;

export type AiReadyGuardResult = 'ran' | 'blocked' | 'skipped';
export function useAiReadyGuard() {
  const queryClient = useQueryClient();
  const [unavailableReason, setUnavailableReason] = useState<AiUnavailableReason | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const checking = useRef(false);

  const runWhenAiReady = useCallback(
    async (action: () => void): Promise<AiReadyGuardResult> => {
      if (checking.current) return 'skipped';
      checking.current = true;
      setIsChecking(true);
      let availability: AiAvailability = 'ready';
      try {
        availability = toAiAvailability(await queryClient.fetchQuery(aiStatusQueries.status()));
      } catch {
      } finally {
        checking.current = false;
        setIsChecking(false);
      }

      if (availability === 'ready') {
        action();
        return 'ran';
      }
      queryClient.removeQueries({ queryKey: aiStatusQueries.allKeys() });
      setUnavailableReason(availability);
      return 'blocked';
    },
    [queryClient],
  );

  const closeUnavailableDialog = useCallback(() => setUnavailableReason(null), []);

  return { runWhenAiReady, isChecking, unavailableReason, closeUnavailableDialog };
}
