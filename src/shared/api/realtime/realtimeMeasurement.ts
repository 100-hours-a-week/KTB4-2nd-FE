let sequence = 0;
let source: string | undefined;

export function recordRealtime(mode: string, event: string, detail: object = {}) {
  source ??= `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const record = {
    mode,
    event,
    source,
    time: performance.timeOrigin + performance.now(),
    ...detail,
  };
  console.info('[realtime-experiment]', JSON.stringify(record));
}

export function measuredSocket(url: string, protocols: string[], mode: string) {
  const socket = new WebSocket(url, protocols);
  const connection = ++sequence;
  socket.addEventListener('open', () => recordRealtime(mode, 'socket-open', { connection }));
  socket.addEventListener('close', () => recordRealtime(mode, 'socket-close', { connection }));
  return socket;
}
