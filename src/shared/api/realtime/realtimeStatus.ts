export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected';

const CONNECTED_POLLING_MS = 30_000;

let status: RealtimeStatus = 'disconnected';
const listeners = new Set<() => void>();

export function getRealtimeStatus() {
  return status;
}

export function isRealtimeConnected() {
  return status === 'connected';
}

export function setRealtimeStatus(next: RealtimeStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

export function subscribeRealtimeStatus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function realtimePollingInterval(disconnectedMs: number) {
  return isRealtimeConnected() ? Math.max(disconnectedMs, CONNECTED_POLLING_MS) : disconnectedMs;
}
