export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected';

/** 웹소켓이 연결돼 있을 때도 놓친 알림을 메우기 위해 느리게 확인합니다. */
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

/** 웹소켓이 끊겨 있으면 기존 폴링 간격을, 연결돼 있으면 느린 안전망 간격을 씁니다. */
export function realtimePollingInterval(disconnectedMs: number) {
  return isRealtimeConnected() ? Math.max(disconnectedMs, CONNECTED_POLLING_MS) : disconnectedMs;
}
