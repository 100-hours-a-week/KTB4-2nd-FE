/**
 * HEIC 50장 선택 후 첫 12장 로드 완료 시간(3회 평균) 측정 결과
 * 2개 4.82초 → 3개 3.77초(-21.8%) → 4개 2.97초(-21.2%) → 6개 2.57초(-13.5%, 1개당 약 -7%).
 * 4개 이후로는 Worker를 늘려도 이득이 크게 줄고 Worker마다 Wasm 메모리를 따로 쓰므로 기본 상한을 4로 둡니다.
 */
export const HEIC_WORKER_DEFAULT_MAX = 4;

/** 측정용으로 개수를 고정하려면 개발자 도구에서 localStorage에 숫자를 넣고 새로고침합니다. */
export const HEIC_WORKER_COUNT_OVERRIDE_KEY = 'heic-worker-count';

let resolvedCount: number | null = null;

function readOverride(): number | null {
  try {
    const value = Number(window.localStorage.getItem(HEIC_WORKER_COUNT_OVERRIDE_KEY));
    return Number.isInteger(value) && value >= 1 ? value : null;
  } catch {
    return null;
  }
}

/** 기기의 논리 코어 수와 메모리로 Worker 수를 정합니다. 서버 렌더에서는 1을 돌려줍니다. */
export function calculateHeicWorkerCount(): number {
  if (typeof navigator === 'undefined') return 1;

  const cores = navigator.hardwareConcurrency || HEIC_WORKER_DEFAULT_MAX;
  const override = typeof window === 'undefined' ? null : readOverride();
  if (override !== null) return Math.min(override, cores);

  // 논리 코어 수로 성능 코어 구성을 알 수는 없으므로, 절반을 사용하는 보수적인 기준을 적용합니다.
  const byCpu = Math.max(1, Math.floor(cores / 2));
  // deviceMemory는 Chromium 계열만 제공합니다. 알 수 없으면 메모리 기준은 적용하지 않습니다.
  const memoryGb = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const byMemory =
    memoryGb === undefined
      ? HEIC_WORKER_DEFAULT_MAX
      : memoryGb <= 2
        ? 1
        : memoryGb <= 4
          ? 2
          : HEIC_WORKER_DEFAULT_MAX;

  return Math.min(byCpu, byMemory, HEIC_WORKER_DEFAULT_MAX);
}

/** Worker Pool과 변환 큐가 같은 값을 쓰도록 페이지가 열려 있는 동안 한 번만 계산합니다. */
export function getHeicWorkerCount(): number {
  resolvedCount ??= calculateHeicWorkerCount();
  return resolvedCount;
}
