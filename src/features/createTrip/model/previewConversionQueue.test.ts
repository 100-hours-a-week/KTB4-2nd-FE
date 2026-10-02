import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createPreviewConversionQueue } from './previewConversionQueue';

function deferredBlob() {
  let resolve!: (blob: Blob) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Blob>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('previewConversionQueue', () => {
  it.each([1, 2, 4, Infinity])(
    '동시 실행 수 %s를 넘지 않고 모든 작업을 처리한다',
    async (limit) => {
      const queue = createPreviewConversionQueue(limit);
      const pending = Array.from({ length: 6 }, deferredBlob);
      let running = 0;
      let peakRunning = 0;
      const run = vi.fn(async (index: number) => {
        running += 1;
        peakRunning = Math.max(peakRunning, running);
        try {
          return await pending[index].promise;
        } finally {
          running -= 1;
        }
      });

      const results = pending.map((_, index) =>
        queue.enqueue(() => run(index), new AbortController().signal),
      );

      await waitFor(() => expect(run).toHaveBeenCalledTimes(Math.min(limit, 6)));
      for (let index = 0; index < pending.length; index += 1) {
        await waitFor(() => expect(run).toHaveBeenCalledWith(index));
        pending[index].resolve(new Blob([String(index)]));
        await results[index];
      }

      expect(peakRunning).toBe(Math.min(limit, 6));
      expect(await Promise.all(results)).toHaveLength(6);
    },
  );

  it('두 번째 작업이 먼저 끝나도 대기 중인 다음 작업을 즉시 시작한다', async () => {
    const queue = createPreviewConversionQueue(2);
    const pending = Array.from({ length: 4 }, deferredBlob);
    const started: number[] = [];
    const results = pending.map((task, index) =>
      queue.enqueue(() => {
        started.push(index);
        return task.promise;
      }, new AbortController().signal),
    );

    await waitFor(() => expect(started).toEqual([0, 1]));
    pending[1].resolve(new Blob());
    await waitFor(() => expect(started).toEqual([0, 1, 2]));
    pending[2].resolve(new Blob());
    await waitFor(() => expect(started).toEqual([0, 1, 2, 3]));
    pending[0].resolve(new Blob());
    pending[3].resolve(new Blob());
    await Promise.all(results);
  });

  it('대기 중 취소된 작업은 실행하지 않는다', async () => {
    const queue = createPreviewConversionQueue(1);
    const first = deferredBlob();
    const firstResult = queue.enqueue(() => first.promise, new AbortController().signal);
    const controller = new AbortController();
    const canceledRun = vi.fn(async () => new Blob());
    const canceledResult = queue.enqueue(canceledRun, controller.signal);
    const canceledAssertion = expect(canceledResult).rejects.toMatchObject({ name: 'AbortError' });

    controller.abort();
    await canceledAssertion;
    first.resolve(new Blob());
    await firstResult;
    const nextRun = vi.fn(async () => new Blob());
    await queue.enqueue(nextRun, new AbortController().signal);

    expect(canceledRun).not.toHaveBeenCalled();
    expect(nextRun).toHaveBeenCalledOnce();
  });

  it('실행 중 취소해도 실제 작업이 끝날 때까지 다음 작업을 기다리게 한다', async () => {
    const queue = createPreviewConversionQueue(1);
    const first = deferredBlob();
    const controller = new AbortController();
    const firstRun = vi.fn(() => first.promise);
    const firstResult = queue.enqueue(firstRun, controller.signal);
    const nextRun = vi.fn(async () => new Blob());
    const nextResult = queue.enqueue(nextRun, new AbortController().signal);

    await waitFor(() => expect(firstRun).toHaveBeenCalledOnce());
    controller.abort();
    await Promise.resolve();
    expect(nextRun).not.toHaveBeenCalled();

    first.resolve(new Blob());
    await Promise.all([firstResult, nextResult]);
    expect(nextRun).toHaveBeenCalledOnce();
  });

  it('변환 실패나 동기 예외 후에도 다음 작업을 실행한다', async () => {
    const queue = createPreviewConversionQueue(1);
    const first = deferredBlob();
    const firstResult = queue.enqueue(() => first.promise, new AbortController().signal);
    const firstAssertion = expect(firstResult).rejects.toThrow('변환 실패');
    const secondResult = queue.enqueue(() => {
      throw new Error('동기 예외');
    }, new AbortController().signal);
    const secondAssertion = expect(secondResult).rejects.toThrow('동기 예외');
    const nextRun = vi.fn(async () => new Blob());
    const nextResult = queue.enqueue(nextRun, new AbortController().signal);

    first.reject(new Error('변환 실패'));
    await Promise.all([firstAssertion, secondAssertion, nextResult]);
    expect(nextRun).toHaveBeenCalledOnce();
  });

  it('작업을 등록한 직후 취소하면 변환을 시작하지 않는다', async () => {
    const queue = createPreviewConversionQueue(2);
    const controller = new AbortController();
    const run = vi.fn(async () => new Blob());
    const result = queue.enqueue(run, controller.signal);
    controller.abort();

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(run).not.toHaveBeenCalled();
  });
});
