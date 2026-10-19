import type { ApiResponse } from '@/shared/api';
import { apiClient } from '@/shared/api/browser';

export type AiStatusResponse = {
  /** Pod가 켜져 있으면 true, 꺼져 있으면 false, RunPod 상태를 읽지 못하면 null입니다. */
  running: boolean | null;
  /** 생성 모델이 요청을 받을 수 있으면 true입니다. */
  ready: boolean;
};

export async function getAiStatus(): Promise<AiStatusResponse> {
  const { data } = await apiClient.get<ApiResponse<AiStatusResponse>>('/ai/runpod/status');

  return data.data;
}
