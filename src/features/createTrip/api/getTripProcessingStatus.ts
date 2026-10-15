import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

/** FINALIZING은 AI 분석이 끝나고 백엔드가 결과를 저장하는 단계라 아직 진행 중입니다. */
export type TripProcessingStatus =
  'PROCESSING' | 'FINALIZING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

export function isTripProcessingRunning(status: TripProcessingStatus) {
  return status === 'PROCESSING' || status === 'FINALIZING';
}

export type TripProcessingStatusResponse = {
  tripId: number;
  status: TripProcessingStatus;
  progress: { done: number; total: number } | null;
  currentStep: string | null;
  result: {
    tripId: number;
    placeFolderCount: number;
    classifiedAttachmentCount: number;
    unclassifiedAttachmentCount: number;
  } | null;
  error: { code: string; message: string } | null;
};

export async function getTripProcessingStatus(
  tripId: number,
): Promise<TripProcessingStatusResponse> {
  const { data } = await apiClient.get<ApiResponse<TripProcessingStatusResponse>>(
    `/trips/${tripId}/processing-status`,
  );

  return data.data;
}
