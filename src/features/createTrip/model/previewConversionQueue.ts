type PreviewTask = {
  run: () => Promise<Blob>;
  resolve: (blob: Blob) => void;
  reject: (error: unknown) => void;
  signal: AbortSignal;
  onAbort: () => void;
};

/** Infinity는 제한 없는 비교 측정에 사용할 수 있습니다. */
export function createPreviewConversionQueue(maxConcurrency: number) {
  if (maxConcurrency !== Infinity && (!Number.isInteger(maxConcurrency) || maxConcurrency < 1)) {
    throw new Error('동시 변환 수는 양의 정수 또는 Infinity여야 합니다.');
  }

  const waiting: PreviewTask[] = [];
  let running = 0;

  const drain = () => {
    while (running < maxConcurrency && waiting.length > 0) {
      const task = waiting.shift()!;
      task.signal.removeEventListener('abort', task.onAbort);
      running += 1;

      // 같은 렌더의 cleanup(Strict Mode 포함)이 먼저 실행되면 작업을 시작하지 않습니다.
      void Promise.resolve()
        .then(() => {
          task.signal.throwIfAborted();
          return task.run();
        })
        .then(task.resolve, task.reject)
        .finally(() => {
          // 실행 중 취소되어도 실제 변환이 끝나기 전에는 자리를 반환하지 않습니다.
          running -= 1;
          drain();
        });
    }
  };

  return {
    enqueue(run: () => Promise<Blob>, signal: AbortSignal): Promise<Blob> {
      if (signal.aborted) return Promise.reject(signal.reason);

      return new Promise((resolve, reject) => {
        const task: PreviewTask = {
          run,
          resolve,
          reject,
          signal,
          onAbort: () => {
            const index = waiting.indexOf(task);
            if (index < 0) return;

            waiting.splice(index, 1);
            signal.removeEventListener('abort', task.onAbort);
            reject(signal.reason);
          },
        };

        signal.addEventListener('abort', task.onAbort, { once: true });
        waiting.push(task);
        drain();
      });
    },
  };
}
