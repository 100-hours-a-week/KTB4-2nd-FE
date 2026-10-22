/** 2026-10-12 → 26.10.12 */
export function formatShortDate(date: string) {
  return date.slice(2).replaceAll('-', '.');
}
