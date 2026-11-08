'use client';

import { useEffect, useState } from 'react';

import {
  isRealtimeConnected,
  publishRealtime,
  subscribeRealtime,
  subscribeRealtimeStatus,
} from '@/shared/api/realtime';

import {
  isNewerSnapshot,
  parseTripPresenceSnapshot,
  tripPresenceCommand,
  tripPresenceDestination,
  type TripPresenceMember,
  type TripPresenceSnapshot,
} from './tripPresence';

/** 서버는 45초 동안 신호가 없으면 참여자를 지웁니다. 두 번 놓쳐도 남도록 15초마다 보냅니다. */
export const TRIP_PRESENCE_HEARTBEAT_MS = 15_000;

const NO_MEMBERS: TripPresenceMember[] = [];

/** 화면에 머무는 동안 여행 접속자 목록에 참여하고, 연결이 끊기면 오래된 목록을 비웁니다. */
export function useTripPresence(tripId: number) {
  const [snapshot, setSnapshot] = useState<TripPresenceSnapshot | null>(null);

  useEffect(() => {
    let latest: TripPresenceSnapshot | null = null;
    // 구독되지 않은 채 보낸 명령은 서버가 연결을 끊으므로, 구독이 확인된 동안만 보냅니다.
    let subscribed = false;
    const clear = () => {
      latest = null;
      setSnapshot(null);
    };

    const unsubscribe = subscribeRealtime({
      destination: tripPresenceDestination(tripId),
      onMessage: (body) => {
        const next = parseTripPresenceSnapshot(body, tripId);
        if (!next || !isNewerSnapshot(latest, next)) return;
        latest = next;
        setSnapshot(next);
      },
      onSubscribed: () => {
        subscribed = true;
        publishRealtime(tripPresenceCommand(tripId, 'join'));
      },
      onRejected: () => {
        subscribed = false;
        clear();
      },
    });
    const unsubscribeStatus = subscribeRealtimeStatus(() => {
      if (isRealtimeConnected()) return;
      subscribed = false;
      clear();
    });
    const heartbeat = window.setInterval(() => {
      if (subscribed) publishRealtime(tripPresenceCommand(tripId, 'heartbeat'));
    }, TRIP_PRESENCE_HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeat);
      unsubscribeStatus();
      if (subscribed) publishRealtime(tripPresenceCommand(tripId, 'leave'));
      unsubscribe();
    };
  }, [tripId]);

  return snapshot?.members ?? NO_MEMBERS;
}
