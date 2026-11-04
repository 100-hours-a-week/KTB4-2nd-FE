import { isId, isRecord } from './syncAiTaskMessage';

const MAX_REMEMBERED = 200;

export function forgetOldest(records: Set<string> | Map<string, number>) {
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
