const GB = 1_000_000_000;
const MB = 1_000_000;

export function formatStorage(bytes: number) {
  if (bytes >= GB) return `${trimDecimal(bytes / GB)}GB`;
  return `${Math.round(bytes / MB)}MB`;
}

function trimDecimal(value: number) {
  return Number(value.toFixed(1)).toString();
}

export function getStorageUsagePercent(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}
