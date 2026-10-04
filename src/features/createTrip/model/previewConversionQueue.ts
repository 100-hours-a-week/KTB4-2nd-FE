type PreviewTask = {
  run: () => Promise<Blob>;
  resolve: (blob: Blob) => void;
  reject: (error: unknown) => void;
  signal: AbortSignal;
  onAbort: () => void;
  getPriority: () => number;
};

export function createPreviewConversionQueue(maxConcurrency: number) {
  if (maxConcurrency !== Infinity && (!Number.isInteger(maxConcurrency) || maxConcurrency < 1)) {
    throw new Error('동시 변환 수는 양의 정수 또는 Infinity여야 합니다.');
  }

  const waiting: PreviewTask[] = [];
  let running = 0;

  const drain = () => {
    while (running < maxConcurrency && waiting.length > 0) {
      let nextIndex = 0;
      let priority = waiting[0].getPriority();
      for (let index = 1; index < waiting.length; index += 1) {
        const candidatePriority = waiting[index].getPriority();
        if (candidatePriority > priority) {
          nextIndex = index;
          priority = candidatePriority;
        }
      }
      const [task] = waiting.splice(nextIndex, 1);
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
    enqueue(
      run: () => Promise<Blob>,
      signal: AbortSignal,
      getPriority: () => number = () => 0,
    ): Promise<Blob> {
      if (signal.aborted) return Promise.reject(signal.reason);

      return new Promise((resolve, reject) => {
        const task: PreviewTask = {
          run,
          resolve,
          reject,
          signal,
          getPriority,
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
