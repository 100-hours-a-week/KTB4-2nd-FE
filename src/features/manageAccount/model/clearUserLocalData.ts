import { clearAllStoryCreateDrafts } from '@/features/createStory';
import { clearPendingTripProcessing } from '@/features/createTrip';
import { clearTripCreateDraft } from '@/features/createTrip/model/tripCreateDraft';
import { REALTIME_EXPERIMENT_SESSION_CHANNEL } from '@/shared/api/realtime/realtimeWorkerProtocol';
import { clearIdentity } from '@/shared/lib/analytics';

/** 브라우저에 남겨 둔 사용자별 임시 데이터(작성 중인 여행·스토리, 진행 중 작업, 분석 식별자)를 지웁니다. */
export function clearUserLocalData() {
  clearAllStoryCreateDrafts();
  clearPendingTripProcessing();
  clearTripCreateDraft();
  clearIdentity();

  if (
    process.env.NEXT_PUBLIC_REALTIME_EXPERIMENT === 'true' &&
    typeof BroadcastChannel !== 'undefined'
  ) {
    const channel = new BroadcastChannel(REALTIME_EXPERIMENT_SESSION_CHANNEL);
    channel.postMessage('logout');
    channel.close();
  }
}
