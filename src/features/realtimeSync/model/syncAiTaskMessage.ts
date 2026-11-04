import type { QueryClient } from '@tanstack/react-query';

import { createTripQueries, storyCreateQueries, tripListQueries } from '@/queryFactory';

export const AI_TASK_DESTINATION = '/user/queue/ai-tasks';

const FINISHED_TRIP_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELED']);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * 웹소켓 알림은 "상태가 바뀌었다"는 신호로만 쓰고, 화면 데이터는 기존 조회 API로 다시 받습니다.
 * 조회 결과를 받는 쪽(완료 토스트, 화면 이동 등)이 그대로 동작하고, 알림 순서가 뒤바뀌어도 최신 상태만 남습니다.
 */
export function syncAiTaskMessage(queryClient: QueryClient, body: unknown) {
  if (!isRecord(body) || !isRecord(body.data)) return;
  const { message, data } = body;

  if (message === 'TRIP_PROCESSING_STATUS_FOUND' && isId(data.tripId)) {
    void queryClient.invalidateQueries({
      queryKey: createTripQueries.processingStatusKeys(data.tripId),
    });
    if (typeof data.status === 'string' && FINISHED_TRIP_STATUSES.has(data.status)) {
      void queryClient.invalidateQueries({ queryKey: tripListQueries.allKeys() });
    }
    return;
  }

  if (message === 'STORY_GENERATION_STATUS_FOUND' && isId(data.generationId)) {
    void queryClient.invalidateQueries({
      queryKey: storyCreateQueries.generationStatusKeys(data.generationId),
    });
  }
}

export function refetchAiTaskQueries(queryClient: QueryClient) {
  return Promise.all(
    [
      [...createTripQueries.allKeys(), 'processingStatus'],
      [...storyCreateQueries.allKeys(), 'generationStatus'],
      [...tripListQueries.allKeys(), 'list'],
    ].map((queryKey) => queryClient.refetchQueries({ queryKey, type: 'active' })),
  );
}
