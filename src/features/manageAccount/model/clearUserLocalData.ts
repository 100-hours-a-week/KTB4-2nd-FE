import { clearAllStoryCreateDrafts } from '@/features/createStory';
import { clearPendingTripProcessing } from '@/features/createTrip';
import { clearTripCreateDraft } from '@/features/createTrip/model/tripCreateDraft';
import { clearIdentity } from '@/shared/lib/analytics';

/** 브라우저에 남겨 둔 사용자별 임시 데이터(작성 중인 여행·스토리, 진행 중 작업, 분석 식별자)를 지웁니다. */
export function clearUserLocalData() {
  clearAllStoryCreateDrafts();
  clearPendingTripProcessing();
  clearTripCreateDraft();
  clearIdentity();
}
