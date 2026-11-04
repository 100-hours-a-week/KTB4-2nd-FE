import { describe, expect, it } from 'vitest';

import { createAiTaskEventFilter } from './aiTaskEventFilter';

function tripEvent(eventId: string, statusVersion: number, executionId = 'exec-1') {
  return {
    message: 'TRIP_PROCESSING_STATUS_FOUND',
    data: { eventId, tripId: 7, executionId, statusVersion, status: 'PROCESSING' },
  };
}

function storyEvent(eventId: string, statusVersion: number, generationId = 3) {
  return {
    message: 'STORY_GENERATION_STATUS_FOUND',
    data: { eventId, tripId: 7, generationId, statusVersion, status: 'PROCESSING' },
  };
}

describe('createAiTaskEventFilter', () => {
  it('같은 eventId가 다시 오면 무시한다', () => {
    const shouldHandle = createAiTaskEventFilter();

    expect(shouldHandle(tripEvent('a', 1))).toBe(true);
    expect(shouldHandle(tripEvent('a', 1))).toBe(false);
    expect(shouldHandle(tripEvent('b', 2))).toBe(true);
  });

  it('같은 작업에서 더 낮은 statusVersion이 늦게 오면 무시한다', () => {
    const shouldHandle = createAiTaskEventFilter();

    expect(shouldHandle(tripEvent('a', 4))).toBe(true);
    expect(shouldHandle(tripEvent('b', 3))).toBe(false);
    expect(shouldHandle(storyEvent('c', 5))).toBe(true);
    expect(shouldHandle(storyEvent('d', 2))).toBe(false);
  });

  it('같은 버전의 다른 알림(완료 알림 등)은 통과시킨다', () => {
    const shouldHandle = createAiTaskEventFilter();

    expect(shouldHandle(tripEvent('a', 4))).toBe(true);
    expect(shouldHandle(tripEvent('b', 4))).toBe(true);
  });

  it('버전은 작업마다 따로 비교한다', () => {
    const shouldHandle = createAiTaskEventFilter();

    expect(shouldHandle(tripEvent('a', 9, 'exec-1'))).toBe(true);
    expect(shouldHandle(tripEvent('b', 1, 'exec-2'))).toBe(true);
    expect(shouldHandle(storyEvent('c', 9, 3))).toBe(true);
    expect(shouldHandle(storyEvent('d', 1, 4))).toBe(true);
  });

  it('eventId나 버전이 없는 알림은 거르지 않는다', () => {
    const shouldHandle = createAiTaskEventFilter();
    const withoutMeta = { message: 'TRIP_PROCESSING_STATUS_FOUND', data: { tripId: 7 } };

    expect(shouldHandle(withoutMeta)).toBe(true);
    expect(shouldHandle(withoutMeta)).toBe(true);
    expect(shouldHandle(undefined)).toBe(true);
  });

  it('오래된 eventId는 잊어서 기록이 계속 늘지 않는다', () => {
    const shouldHandle = createAiTaskEventFilter();

    for (let index = 0; index <= 200; index += 1) {
      shouldHandle(tripEvent(`event-${index}`, 1, `exec-${index}`));
    }

    expect(shouldHandle(tripEvent('event-200', 1, 'exec-200'))).toBe(false);
    expect(shouldHandle(tripEvent('event-0', 1, 'exec-0'))).toBe(true);
  });
});
