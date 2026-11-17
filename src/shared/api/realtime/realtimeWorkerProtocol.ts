import type { RealtimeSubscription } from './realtimeDirect';
import type { RealtimeStatus } from './realtimeStatus';

export type WorkerSubscription = Pick<
  RealtimeSubscription,
  'destination' | 'presence' | 'requestId'
> & {
  rejectable: boolean;
};

export type TabMessage =
  | { type: 'attach'; url: string; userId: number }
  | { type: 'subscribe'; id: number; subscription: WorkerSubscription }
  | { type: 'unsubscribe'; id: number }
  | { type: 'publish'; destination: string; body?: unknown }
  | { type: 'ping' | 'detach' };

export type WorkerMessage =
  | { type: 'ready' | 'expired' | 'unauthorized' }
  | { type: 'status'; status: RealtimeStatus }
  | { type: 'subscribed' | 'rejected'; id: number }
  | { type: 'message'; id: number; body: unknown };

export const PORT_PING_MS = 15_000;
export const PORT_LEASE_MS = 120_000;

export const REALTIME_EXPERIMENT_SESSION_CHANNEL = 'realtime-experiment-session';
