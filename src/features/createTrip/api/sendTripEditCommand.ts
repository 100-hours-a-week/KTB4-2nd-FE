import { rememberOwnTripEditRequest } from '@/features/realtimeSync';
import { publishRealtime, subscribeRealtime } from '@/shared/api/realtime';

import type { UpdateTripRequest } from './updateTrip';

export type TripEditCommand =
  | { type: 'update'; changes: UpdateTripRequest }
  | { type: 'attachments/delete'; attachmentIds: number[] };

export class TripEditCommandError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'TripEditCommandError';
  }
}

const COMMAND_RESULTS_DESTINATION = '/user/queue/command-results';
const RESULT_TIMEOUT_MS = 15_000;
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function sendTripEditCommand(tripId: number, requestId: string, command: TripEditCommand) {
  const { type, ...payload } = command;
  rememberOwnTripEditRequest(requestId);

  return new Promise<void>((resolve, reject) => {
    let finished = false;
    let unsubscribe: (() => void) | null = null;
    const finish = (error?: TripEditCommandError) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      unsubscribe?.();
      if (error) reject(error);
      else resolve();
    };
    const timeout = window.setTimeout(
      () => finish(new TripEditCommandError('TIMEOUT')),
      RESULT_TIMEOUT_MS,
    );

    unsubscribe = subscribeRealtime({
      destination: COMMAND_RESULTS_DESTINATION,
      onMessage: (body) => {
        if (!isRecord(body) || !isRecord(body.data) || body.data.requestId !== requestId) return;
        if (body.data.status === 'SUCCEEDED') finish();
        else if (body.data.status === 'REJECTED') {
          finish(new TripEditCommandError(typeof body.message === 'string' ? body.message : ''));
        }
      },
      onSubscribed: () => {
        publishRealtime(`/app/trips/${tripId}/${type}`, { requestId, ...payload });
      },
    });
  });
}
