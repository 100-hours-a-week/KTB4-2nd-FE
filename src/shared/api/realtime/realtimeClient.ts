'use client';

import * as direct from './realtimeDirect';
import type { RealtimeSubscription } from './realtimeDirect';
import { recordRealtime } from './realtimeMeasurement';
import { startSharedRealtime } from './realtimeShared';

export type { RealtimeSubscription } from './realtimeDirect';

type Mode = 'baseline' | 'focus' | 'visible' | 'shared';

type Entry = { subscription: RealtimeSubscription; remove?: () => void };
type Transport = {
  subscribe: typeof direct.subscribeRealtime;
  publish: typeof direct.publishRealtime;
  stop: () => void | Promise<void>;
};

const entries = new Set<Entry>();
let transport: Transport | undefined;

function getMode(): Mode | undefined {
  if (process.env.NEXT_PUBLIC_REALTIME_EXPERIMENT !== 'true') return;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('realtimeExperiment');
    const mode = fromUrl ?? sessionStorage.getItem('realtimeExperiment');
    if (mode === 'baseline' || mode === 'focus' || mode === 'visible' || mode === 'shared') {
      if (fromUrl) sessionStorage.setItem('realtimeExperiment', mode);
      return mode;
    }
  } catch {
    // Storage can be disabled by browser policy.
  }
  return 'baseline';
}

export function subscribeRealtime(subscription: RealtimeSubscription) {
  const entry: Entry = {
    subscription: {
      ...subscription,
      onRejected:
        subscription.onRejected &&
        (() => {
          entries.delete(entry);
          subscription.onRejected?.();
        }),
    },
  };
  entries.add(entry);
  entry.remove = transport?.subscribe(entry.subscription);
  return () => {
    entries.delete(entry);
    entry.remove?.();
  };
}

export function publishRealtime(destination: string, body?: unknown) {
  return transport?.publish(destination, body) ?? false;
}

export function connectRealtime(subscriptions: RealtimeSubscription[], userId?: number | null) {
  const mode = getMode();
  const unsubscribe = subscriptions.map(subscribeRealtime);
  let disposed = false;
  let closing: Promise<void> | undefined;

  function attach(next: Transport) {
    transport = next;
    entries.forEach((entry) => {
      if (!entry.remove) entry.remove = next.subscribe(entry.subscription);
    });
  }

  function disconnect() {
    const previous = transport;
    transport = undefined;
    entries.forEach((entry) => {
      entry.remove?.();
      entry.remove = undefined;
    });
    if (previous) closing = Promise.resolve(previous.stop());
  }

  function startDirect(measurement = mode) {
    const stop = direct.connectRealtime([], { measurement });
    attach({ subscribe: direct.subscribeRealtime, publish: direct.publishRealtime, stop });
  }

  function fallback() {
    if (disposed) return;
    disconnect();
    startDirect('shared');
  }

  function startShared() {
    if (disposed) return;
    if (typeof SharedWorker !== 'undefined' && userId != null) {
      try {
        attach(
          startSharedRealtime(userId, fallback, () => {
            disconnect();
            startShared();
          }),
        );
        return;
      } catch {
        recordRealtime('shared', 'fallback', { reason: 'initialization' });
      }
    } else {
      recordRealtime('shared', 'fallback', { reason: 'unsupported-or-no-session' });
    }
    startDirect();
  }

  function shouldConnect() {
    if (mode === 'focus') return document.visibilityState === 'visible' && document.hasFocus();
    return document.visibilityState === 'visible';
  }

  function syncWindow() {
    if (disposed) return;
    if (!shouldConnect()) {
      disconnect();
      return;
    }
    if (transport) return;
    if (!closing) startDirect();
    else {
      void closing.then(() => {
        if (!disposed && !transport && shouldConnect()) startDirect();
      });
    }
  }

  if (mode === 'focus' || mode === 'visible') {
    document.addEventListener('visibilitychange', syncWindow);
    if (mode === 'focus') {
      window.addEventListener('focus', syncWindow);
      window.addEventListener('blur', syncWindow);
    }
    syncWindow();
  } else if (mode === 'shared') {
    startShared();
  } else {
    startDirect();
  }

  return () => {
    disposed = true;
    document.removeEventListener('visibilitychange', syncWindow);
    window.removeEventListener('focus', syncWindow);
    window.removeEventListener('blur', syncWindow);
    unsubscribe.forEach((remove) => remove());
    disconnect();
  };
}
