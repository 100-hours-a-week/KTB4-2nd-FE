import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelStoryGeneration } from '../api/cancelStoryGeneration';
import { createStoryGeneration } from '../api/createStoryGeneration';
import { getStoryGenerationStatus } from '../api/getStoryGenerationStatus';
import { clearAllStoryCreateDrafts, readStoryCreateDraft } from './storyCreateDraft';
import { useStoryGeneration } from './useStoryGeneration';

vi.mock('@/shared/api/browser', () => ({ fetchCsrfToken: vi.fn().mockResolvedValue('csrf') }));
vi.mock('../api/createStoryGeneration', () => ({ createStoryGeneration: vi.fn() }));
vi.mock('../api/cancelStoryGeneration', () => ({ cancelStoryGeneration: vi.fn() }));
vi.mock('../api/getStoryGenerationStatus', () => ({ getStoryGenerationStatus: vi.fn() }));
const input = { mood: 'EMOTIONAL' as const, tripPlaceIds: [3, 1] };
const progress = {
  generationId: 31,
  status: 'PROCESSING' as const,
  progress: 40,
  storyId: null,
  error: null,
};
const clients: QueryClient[] = [];
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  return renderHook(() => useStoryGeneration(7), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
const advance = (ms = 20) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  clearAllStoryCreateDrafts();
  vi.mocked(createStoryGeneration).mockResolvedValue({
    generationId: 31,
    tripId: 7,
    status: 'QUEUED',
  });
  vi.mocked(getStoryGenerationStatus).mockResolvedValue(progress);
  vi.mocked(cancelStoryGeneration).mockResolvedValue(undefined);
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  clearAllStoryCreateDrafts();
  vi.useRealTimers();
});
describe('useStoryGeneration API', () => {
  it('선택 순서를 전달하고 중복 생성 요청을 막는다', async () => {
    const { result } = setup();
    act(() => {
      result.current.start(input);
      result.current.start(input);
    });
    await advance();
    expect(createStoryGeneration).toHaveBeenCalledExactlyOnceWith(
      7,
      { mood: 'EMOTIONAL', tripPlaceIds: [3, 1] },
      'csrf',
    );
    expect(result.current.status).toBe('processing');
  });
  it('2초마다 상태를 조회하고 완료 후에는 조회를 중단한다', async () => {
    const { result } = setup();
    act(() => result.current.start(input));
    await advance();
    expect(getStoryGenerationStatus).toHaveBeenCalledTimes(1);
    vi.mocked(getStoryGenerationStatus).mockResolvedValue({
      ...progress,
      status: 'COMPLETED',
      progress: 100,
    });
    await advance(2000);
    expect(result.current.status).toBe('completed');
    await advance(4000);
    expect(getStoryGenerationStatus).toHaveBeenCalledTimes(2);
  });
  it('서버의 취소 성공을 기다리고 중복 취소를 막는다', async () => {
    let finish!: () => void;
    vi.mocked(cancelStoryGeneration).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = setup();
    act(() => result.current.start(input));
    await advance();
    act(() => {
      result.current.cancel();
      result.current.cancel();
    });
    await advance();
    expect(cancelStoryGeneration).toHaveBeenCalledExactlyOnceWith(31, 'csrf');
    expect(result.current.status).toBe('processing');
    await act(async () => finish());
    await advance();
    expect(result.current.status).toBe('idle');
  });
  it('취소가 거절되면 생성 상태를 유지한다', async () => {
    vi.mocked(cancelStoryGeneration).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409 },
    });
    const { result } = setup();
    act(() => result.current.start(input));
    await advance();
    act(() => result.current.cancel());
    await advance();
    expect(result.current.status).toBe('processing');
  });
  it('화면을 나간 뒤 도착한 생성 응답도 저장해 복원한다', async () => {
    let finish!: (value: { generationId: number; tripId: number; status: 'QUEUED' }) => void;
    vi.mocked(createStoryGeneration).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = setup();
    act(() => view.result.current.start(input));
    await advance();
    view.unmount();
    await act(async () => finish({ generationId: 31, tripId: 7, status: 'QUEUED' }));
    expect(readStoryCreateDraft(7).generationId).toBe(31);
    const resumed = setup();
    await advance();
    expect(resumed.result.current.status).toBe('processing');
    expect(getStoryGenerationStatus).toHaveBeenCalledWith(31);
  });
  it('서버에 작업이 없으면 폴링을 중단한다', async () => {
    vi.mocked(getStoryGenerationStatus).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });
    const { result } = setup();
    act(() => result.current.start(input));
    await advance();
    expect(result.current.status).toBe('idle');
    await advance(4000);
    expect(getStoryGenerationStatus).toHaveBeenCalledTimes(1);
  });
});
