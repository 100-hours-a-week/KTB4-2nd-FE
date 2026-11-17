import { getRealtimeUrl } from './config';
import type { RealtimeSubscription } from './realtimeDirect';
import { recordRealtime } from './realtimeMeasurement';
import { setRealtimeStatus } from './realtimeStatus';
import { PORT_PING_MS, type TabMessage, type WorkerMessage } from './realtimeWorkerProtocol';

export function startSharedRealtime(userId: number, fallback: () => void, reconnect: () => void) {
  const url = getRealtimeUrl();
  const workerUrl = process.env.NEXT_PUBLIC_REALTIME_WORKER_URL;
  if (!workerUrl) throw new Error('SharedWorker asset is unavailable');
  const worker = new SharedWorker(workerUrl, {
    name: `travel-realtime-v1-${userId}`,
    type: 'module',
  });
  const port = worker.port;
  const entries = new Map<number, RealtimeSubscription>();
  let nextId = 0;
  let ready = false;
  let connected = false;
  let stopped = false;

  function send(message: TabMessage) {
    port.postMessage(message);
  }

  function register(
    id: number,
    { destination, onRejected, presence, requestId }: RealtimeSubscription,
  ) {
    send({
      type: 'subscribe',
      id,
      subscription: { destination, rejectable: Boolean(onRejected), presence, requestId },
    });
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    connected = false;
    clearTimeout(timeout);
    clearInterval(timer);
    document.removeEventListener('visibilitychange', ping);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', ping);
    worker.onerror = null;
    port.onmessage = null;
    send({ type: 'detach' });
    port.close();
    entries.clear();
    setRealtimeStatus('disconnected');
  }

  function fail(reason: string) {
    if (stopped) return;
    recordRealtime('shared', 'fallback', { reason });
    stop();
    fallback();
  }

  function ping() {
    if (!stopped && ready) send({ type: 'ping' });
  }

  function pagehide(event: PageTransitionEvent) {
    if (!event.persisted) stop();
  }

  const timeout = setTimeout(() => fail('startup-timeout'), 3_000);
  const timer = setInterval(ping, PORT_PING_MS);
  document.addEventListener('visibilitychange', ping);
  window.addEventListener('pageshow', ping);
  window.addEventListener('pagehide', pagehide);
  worker.onerror = (event) => {
    event.preventDefault();
    fail('worker-error');
  };
  port.addEventListener('close', () => fail('port-closed'));
  port.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
    if (stopped) return;
    switch (data.type) {
      case 'ready':
        ready = true;
        clearTimeout(timeout);
        entries.forEach((entry, id) => register(id, entry));
        break;
      case 'status':
        connected = data.status === 'connected';
        setRealtimeStatus(data.status);
        break;
      case 'subscribed': {
        const entry = entries.get(data.id);
        if (!entry) break;
        // SUBSCRIBE가 완료된 직후에는 저장 명령을 보낼 수 있습니다.
        connected = true;
        entry.onSubscribed?.(Boolean(entry.presence));
        break;
      }
      case 'rejected': {
        const entry = entries.get(data.id);
        entries.delete(data.id);
        entry?.onRejected?.();
        break;
      }
      case 'message':
        entries.get(data.id)?.onMessage(data.body);
        break;
      case 'expired':
        stop();
        reconnect();
        break;
      case 'unauthorized':
        stop();
        break;
    }
  };
  send({ type: 'attach', url, userId });

  return {
    stop,
    subscribe(subscription: RealtimeSubscription) {
      const id = ++nextId;
      entries.set(id, subscription);
      if (ready && !stopped) register(id, subscription);
      return () => {
        if (entries.delete(id) && ready && !stopped) send({ type: 'unsubscribe', id });
      };
    },
    publish(destination: string, body?: unknown) {
      if (!connected || stopped) return false;
      send({ type: 'publish', destination, body });
      return true;
    },
  };
}
