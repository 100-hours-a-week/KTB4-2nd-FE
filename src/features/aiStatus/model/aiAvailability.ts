import type { AiStatusResponse } from '../api/getAiStatus';

/**
 * - ready: 바로 사용할 수 있어요.
 * - starting: Pod는 켜졌지만 모델을 올리는 중이에요. 보통 3분 정도 걸려요.
 * - off: Pod가 꺼져 있거나 상태를 알 수 없고, 모델도 준비되지 않았어요.
 */
export type AiAvailability = 'ready' | 'starting' | 'off';

export function toAiAvailability({ running, ready }: AiStatusResponse): AiAvailability {
  if (ready) return 'ready';
  return running === true ? 'starting' : 'off';
}
