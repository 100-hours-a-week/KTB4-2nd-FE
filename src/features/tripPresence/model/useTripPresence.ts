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

export const TRIP_PRESENCE_HEARTBEAT_MS = 15_000;

const NO_MEMBERS: TripPresenceMember[] = [];

export function useTripPresence(tripId: number) {
  const [snapshot, setSnapshot] = useState<TripPresenceSnapshot | null>(null);

  useEffect(() => {
    let latest: TripPresenceSnapshot | null = null;
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
