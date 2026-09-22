import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

export type TripProcessingStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

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
