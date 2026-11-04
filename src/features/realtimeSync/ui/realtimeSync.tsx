'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  connectRealtime,
  isRealtimeConnected,
  subscribeRealtimeStatus,
} from '@/shared/api/realtime';

import { createAiTaskEventFilter } from '../model/aiTaskEventFilter';
import {
  AI_TASK_DESTINATION,
  refetchAiTaskQueries,
  syncAiTaskMessage,
} from '../model/syncAiTaskMessage';

export function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let wasConnected = isRealtimeConnected();
    const unsubscribe = subscribeRealtimeStatus(() => {
      const connected = isRealtimeConnected();
      if (connected === wasConnected) return;
      wasConnected = connected;
      void refetchAiTaskQueries(queryClient);
    });
    const shouldHandle = createAiTaskEventFilter();
    const disconnect = connectRealtime([
      {
        destination: AI_TASK_DESTINATION,
        onMessage: (body) => {
          if (shouldHandle(body)) syncAiTaskMessage(queryClient, body);
        },
      },
    ]);

    return () => {
      unsubscribe();
      disconnect();
    };
  }, [queryClient]);

  return null;
}
