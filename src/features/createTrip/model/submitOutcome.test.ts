import { describe, expect, it } from 'vitest';

import type { TripProcessingStatusResponse } from '../api/getTripProcessingStatus';
import { getTripCreateSubmitOutcome } from './submitOutcome';

function result(
  status: TripProcessingStatusResponse['status'],
  error: TripProcessingStatusResponse['error'] = null,
): TripProcessingStatusResponse {
  return { tripId: 7, status, progress: null, currentStep: null, result: null, error };
}

describe('getTripCreateSubmitOutcome', () => {
  it('정리가 끝나면 성공으로 보고 홈으로 보낸다', () => {
    expect(getTripCreateSubmitOutcome(result('COMPLETED'))).toEqual({
      kind: 'completed',
      message: '여행을 만들었어요.',
      redirectTo: '/',
    });
  });

  it('실패하면 200으로 와도 성공으로 처리하지 않는다', () => {
    const outcome = getTripCreateSubmitOutcome(
      result('FAILED', { code: 'AI_PROCESSING_FAILED', message: '첨부 처리에 실패했습니다.' }),
    );

    expect(outcome.kind).toBe('failed');
    expect(outcome.message).toBe('첨부 처리에 실패했습니다.');
  });

  it('실패 사유가 없으면 기본 문구로 알린다', () => {
    const outcome = getTripCreateSubmitOutcome(result('FAILED'));

    expect(outcome).toEqual({
      kind: 'failed',
      message: '사진을 정리하지 못했어요. 잠시 후 다시 시도해주세요.',
    });
  });

  it('실패는 화면을 옮기지 않아 같은 여행에 다시 올릴 수 있게 한다', () => {
    expect(getTripCreateSubmitOutcome(result('FAILED'))).not.toHaveProperty('redirectTo');
  });

  it('취소되면 목록으로 보낸다', () => {
    expect(getTripCreateSubmitOutcome(result('CANCELED'))).toEqual({
      kind: 'canceled',
      message: '사진 정리를 취소했어요.',
      redirectTo: '/trips',
    });
  });

  it('아직 처리 중인 응답도 성공으로 처리하지 않는다', () => {
    expect(getTripCreateSubmitOutcome(result('PROCESSING')).kind).toBe('failed');
  });
});
