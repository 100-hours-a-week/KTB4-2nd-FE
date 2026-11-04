import { isId, isRecord } from './syncAiTaskMessage';

/** 오래 켜 둔 탭에서도 메모리가 늘지 않도록 최근 기록만 남깁니다. */
const MAX_REMEMBERED = 200;

function forgetOldest(records: Set<string> | Map<string, number>) {
  if (records.size <= MAX_REMEMBERED) return;
  const oldest = records.keys().next().value;
  if (oldest !== undefined) records.delete(oldest);
}

function getJobKey(message: unknown, data: Record<string, unknown>) {
  if (message === 'TRIP_PROCESSING_STATUS_FOUND' && typeof data.executionId === 'string')
    return `trip:${data.executionId}`;
  if (message === 'STORY_GENERATION_STATUS_FOUND' && isId(data.generationId))
    return `story:${data.generationId}`;
  return null;
}

/**
 * 처리할 필요가 없는 AI 작업 알림을 거릅니다.
 * - 같은 `eventId`가 다시 오면 무시합니다.
 * - 같은 작업에서 이미 받은 것보다 낮은 `statusVersion`이 늦게 오면 무시합니다.
 *   완료 알림은 직전 알림과 버전이 같을 수 있어 같은 버전은 통과시킵니다.
 */
export function createAiTaskEventFilter() {
  const seenEventIds = new Set<string>();
  const latestVersions = new Map<string, number>();

  return function shouldHandle(body: unknown) {
    if (!isRecord(body) || !isRecord(body.data)) return true;
    const { message, data } = body;

    if (typeof data.eventId === 'string') {
      if (seenEventIds.has(data.eventId)) return false;
      seenEventIds.add(data.eventId);
      forgetOldest(seenEventIds);
    }

    const jobKey = getJobKey(message, data);
    if (jobKey !== null && typeof data.statusVersion === 'number') {
      const latest = latestVersions.get(jobKey);
      if (latest !== undefined && data.statusVersion < latest) return false;
      latestVersions.set(jobKey, data.statusVersion);
      forgetOldest(latestVersions);
    }

    return true;
  };
}
