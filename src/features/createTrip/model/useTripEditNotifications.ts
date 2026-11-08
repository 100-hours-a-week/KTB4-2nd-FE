'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { createTripEventFilter, tripEventsDestination } from '@/features/realtimeSync';
import { createTripQueries } from '@/queryFactory';
import { subscribeRealtime } from '@/shared/api/realtime';
import { toast } from '@/shared/ui/toast';

import { isOwnTripEditRequest } from '../api/sendTripEditCommand';

const CHANGE_LABELS: [key: string, label: string, particle: string][] = [
  ['tripName', '이름', '이'],
  ['startDate', '날짜', '가'],
  ['regionCodes', '장소', '가'],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 이벤트에 누가 바꿨는지는 없어서, 무엇이 바뀌었는지만 알려줍니다. */
export function getTripEditNotice(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.data)) return null;
  const { message, data } = body;

  if (message === 'TRIP_UPDATED') {
    const changes = isRecord(data.changes) ? data.changes : {};
    const changed = CHANGE_LABELS.filter(([key]) => key in changes);
    if (changed.length === 0) return '여행 정보가 바뀌었어요.';
    const particle = changed[changed.length - 1][2];
    return `여행 ${changed.map(([, label]) => label).join('·')}${particle} 바뀌었어요.`;
  }
  if (message === 'TRIP_PHOTOS_DELETED') {
    const count = typeof data.attachmentCount === 'number' ? data.attachmentCount : null;
    return count ? `사진 ${count}장이 지워졌어요.` : '사진이 지워졌어요.';
  }
  return null;
}

/** 수정 화면에 있는 동안 다른 곳에서 바뀐 내용을 알리고, 화면의 기준 값을 새로 받습니다. */
export function useTripEditNotifications(tripId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const shouldHandle = createTripEventFilter();

    return subscribeRealtime({
      destination: tripEventsDestination(tripId),
      onMessage: (body) => {
        if (!shouldHandle(body) || !isRecord(body) || !isRecord(body.data)) return;
        if (body.data.tripId !== tripId || isOwnTripEditRequest(body.data.requestId)) return;

        const notice = getTripEditNotice(body);
        if (!notice) return;
        toast.info(notice);
        void queryClient.invalidateQueries({ queryKey: createTripQueries.editKeys(tripId) });
      },
    });
  }, [queryClient, tripId]);
}
