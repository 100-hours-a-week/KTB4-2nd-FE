type PreviewTask = {
  run: () => Promise<Blob>;
  resolve: (blob: Blob) => void;
  reject: (error: unknown) => void;
  signal: AbortSignal;
  onAbort: () => void;
};

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

      void Promise.resolve()
        .then(() => {
          task.signal.throwIfAborted();
          return task.run();
        })
        .then(task.resolve, task.reject)
        .finally(() => {
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
