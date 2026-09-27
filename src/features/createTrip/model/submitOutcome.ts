import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';

export type TripCreateSubmitOutcome =
  | { kind: 'completed'; message: string; redirectTo: string }
  | { kind: 'canceled'; message: string; redirectTo: string }
  | { kind: 'failed'; message: string };

const FALLBACK_FAILURE_MESSAGE = '사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.';

export function getTripCreateSubmitOutcome(
  result: TripProcessingStatusResponse,
): TripCreateSubmitOutcome {
  if (result.status === 'COMPLETED') {
    return { kind: 'completed', message: '여행을 만들었어요.', redirectTo: '/' };
  }

  if (result.status === 'CANCELED') {
    return { kind: 'canceled', message: '사진 정리를 취소했어요.', redirectTo: '/trips' };
  }

  return { kind: 'failed', message: result.error?.message ?? FALLBACK_FAILURE_MESSAGE };
}
