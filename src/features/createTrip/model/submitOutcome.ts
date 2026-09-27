import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';

export type TripCreateSubmitOutcome =
  | { kind: 'completed'; message: string; redirectTo: string }
  | { kind: 'canceled'; message: string; redirectTo: string }
  | { kind: 'failed'; message: string };

const FALLBACK_FAILURE_MESSAGE = '사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.';

/**
 * 사진 정리가 실패해도 업로드 API는 200으로 응답하고 본문 status에 결과를 담아줍니다.
 * HTTP 상태만 보면 실패를 성공으로 처리하게 되므로 status로 한 번 더 갈라줍니다.
 */
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
