import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoryGenerationRequest } from './types';
const request = vi.fn<StoryGenerationRequest>();
import { clearStoryGenerationJobs } from './storyGenerationStore';
import { useStoryGeneration } from './useStoryGeneration';
import { toast } from '@/shared/ui/toast';

vi.mock('@/shared/ui/toast', () => ({ toast: { error: vi.fn(), warning: vi.fn() } }));
const input = { tripId: 7, mood: 'EMOTIONAL' as const, folderIds: [1, 2] };

describe('useStoryGeneration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    clearStoryGenerationJobs();
    vi.useRealTimers();
  });

  it('완료 상태를 유지하고 중복 요청을 막는다', async () => {
    let complete!: () => void;
    vi.mocked(request).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const { result } = renderHook(() => useStoryGeneration(7, request));
    act(() => {
      void result.current.start(input);
      void result.current.start(input);
    });
    expect(result.current.status).toBe('processing');
    expect(request).toHaveBeenCalledTimes(1);
    await act(async () => complete());
    expect(result.current.status).toBe('completed');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('60초 경과를 알리고 180초에 작업을 중단한다', async () => {
    vi.mocked(request).mockImplementation(
      (_input, signal) =>
        new Promise<void>((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const { result } = renderHook(() => useStoryGeneration(7, request));
    act(() => {
      void result.current.start(input);
    });
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });
    expect(result.current.elapsed).toBe(60);
    expect(result.current.status).toBe('processing');
    await act(async () => {
      vi.advanceTimersByTime(120000);
    });
    expect(result.current.status).toBe('failed');
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('취소한 작업의 늦은 완료를 무시하고 새 작업을 시작한다', async () => {
    const complete: (() => void)[] = [];
    vi.mocked(request).mockImplementation(
      () => new Promise<void>((resolve) => complete.push(resolve)),
    );
    const { result } = renderHook(() => useStoryGeneration(7, request));
    act(() => {
      void result.current.start(input);
    });
    act(() => result.current.cancel());
    expect(result.current.status).toBe('idle');
    act(() => {
      void result.current.start(input);
    });
    await act(async () => complete[0]());
    expect(result.current.status).toBe('processing');
    await act(async () => complete[1]());
    expect(result.current.status).toBe('completed');
  });

  it('실패 후 같은 입력으로 재시도하고 화면을 나가도 진행을 유지한다', async () => {
    vi.mocked(request)
      .mockRejectedValueOnce(new Error('failed'))
      .mockImplementation(
        (_input, signal) =>
          new Promise<void>((_resolve, reject) =>
            signal.addEventListener('abort', () => reject(new Error('aborted'))),
          ),
      );
    const { result, unmount } = renderHook(() => useStoryGeneration(7, request));
    await act(async () => result.current.start(input));
    expect(result.current.status).toBe('failed');
    act(() => {
      void result.current.start(input);
    });
    expect(request).toHaveBeenLastCalledWith(input, expect.any(AbortSignal), expect.any(Function));
    await act(async () => unmount());
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    const resumed = renderHook(() => useStoryGeneration(7, request));
    expect(resumed.result.current.status).toBe('processing');
    expect(resumed.result.current.input).toEqual(input);
    act(() => resumed.result.current.cancel());
    expect(vi.getTimerCount()).toBe(0);
  });
  it('수신 이벤트로 진행률을 갱신하고 이전 작업 이벤트는 무시한다', async () => {
    const sinks: ((event: { progressPercent: number; message: string }) => void)[] = [];
    vi.mocked(request).mockImplementation((_input, _signal, sink) => {
      sinks.push(sink);
      return new Promise<void>(() => {});
    });
    const { result } = renderHook(() => useStoryGeneration(7, request));
    act(() => {
      void result.current.start(input);
    });
    act(() => sinks[0]({ progressPercent: 55, message: '장면을 정리하고 있어요' }));
    expect(result.current.progressPercent).toBe(55);
    expect(result.current.message).toBe('장면을 정리하고 있어요');
    act(() => sinks[0]({ progressPercent: 20, message: '뒤늦게 도착한 이벤트' }));
    expect(result.current.progressPercent).toBe(55);
    act(() => {
      result.current.cancel();
      void result.current.start(input);
    });
    act(() => sinks[0]({ progressPercent: 90, message: '이전 작업 이벤트' }));
    expect(result.current.progressPercent).toBe(0);
    act(() => sinks[1]({ progressPercent: 100, message: '마무리 중' }));
    expect(result.current.progressPercent).toBe(99);
    expect(result.current.status).toBe('processing');
  });
  it('API가 연결되지 않으면 작업이나 가짜 진행률을 생성하지 않는다', async () => {
    const { result } = renderHook(() => useStoryGeneration(7));
    await act(async () => result.current.start(input));
    expect(result.current.status).toBe('idle');
    expect(result.current.progressPercent).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(toast.warning).toHaveBeenCalledWith('스토리 생성 기능을 준비하고 있어요.');
  });
});
