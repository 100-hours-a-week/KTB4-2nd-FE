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

/** 로그인 화면에서 웹소켓을 하나만 연결하고, AI 작업 알림을 React Query 캐시에 반영합니다. */
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
