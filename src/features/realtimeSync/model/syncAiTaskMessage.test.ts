import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTripQueries, storyCreateQueries, tripListQueries } from '@/queryFactory';

import { refetchAiTaskQueries, syncAiTaskMessage } from './syncAiTaskMessage';

let client: QueryClient;
const listKey = tripListQueries.listKeys({ sort: 'LATEST', favorite: false });

function seed(queryKey: readonly unknown[]) {
  client.setQueryData(queryKey, { seeded: true });
}

function isInvalidated(queryKey: readonly unknown[]) {
  return client.getQueryState(queryKey)?.isInvalidated ?? false;
}

describe('syncAiTaskMessage', () => {
  beforeEach(() => {
    client = new QueryClient();
  });

  it('여행 처리 알림은 그 여행의 모든 처리 상태 조회를 다시 받게 한다', () => {
    const page = createTripQueries.processingStatusKeys(7);
    const background = [...page, 'background', 100];
    const edit = [...page, 'edit'];
    const other = createTripQueries.processingStatusKeys(8);
    [page, background, edit, other, listKey].forEach(seed);

    syncAiTaskMessage(client, {
      message: 'TRIP_PROCESSING_STATUS_FOUND',
      data: { tripId: 7, status: 'FINALIZING' },
    });

    expect(isInvalidated(page)).toBe(true);
    expect(isInvalidated(background)).toBe(true);
    expect(isInvalidated(edit)).toBe(true);
    expect(isInvalidated(other)).toBe(false);
    expect(isInvalidated(listKey)).toBe(false);
  });

  it('여행 처리가 끝나면 여행 목록도 다시 받는다', () => {
    seed(listKey);

    syncAiTaskMessage(client, {
      message: 'TRIP_PROCESSING_STATUS_FOUND',
      data: { tripId: 7, status: 'COMPLETED' },
    });

    expect(isInvalidated(listKey)).toBe(true);
  });

  it('스토리 생성 알림은 해당 생성 작업의 상태 조회만 다시 받게 한다', () => {
    const target = storyCreateQueries.generationStatusKeys(3);
    const other = storyCreateQueries.generationStatusKeys(4);
    [target, other].forEach(seed);

    syncAiTaskMessage(client, {
      message: 'STORY_GENERATION_STATUS_FOUND',
      data: { tripId: 7, generationId: 3, status: 'COMPLETED' },
    });

    expect(isInvalidated(target)).toBe(true);
    expect(isInvalidated(other)).toBe(false);
  });

  it('형식이 맞지 않거나 모르는 알림은 무시한다', () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    [
      undefined,
      'text',
      { message: 'TRIP_PROCESSING_STATUS_FOUND', data: null },
      { message: 'TRIP_PROCESSING_STATUS_FOUND', data: { tripId: '7' } },
      { message: 'STORY_GENERATION_STATUS_FOUND', data: { generationId: 0 } },
      { message: 'TRIP_UPDATED', data: { tripId: 7 } },
    ].forEach((body) => syncAiTaskMessage(client, body));

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('refetchAiTaskQueries', () => {
  it('처리 상태·스토리 생성 상태·여행 목록 중 화면에 떠 있는 조회만 다시 받는다', async () => {
    client = new QueryClient();
    const refetch = vi.spyOn(client, 'refetchQueries');

    await refetchAiTaskQueries(client);

    expect(refetch.mock.calls.map(([filters]) => filters)).toEqual([
      { queryKey: ['createTrip', 'processingStatus'], type: 'active' },
      { queryKey: ['storyCreate', 'generationStatus'], type: 'active' },
      { queryKey: ['tripList', 'list'], type: 'active' },
    ]);
  });
});
