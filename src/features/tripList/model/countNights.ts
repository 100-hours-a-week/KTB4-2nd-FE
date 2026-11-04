const MILLISECONDS_PER_DAY = 86_400_000;

export function countNights(startDate: string, endDate: string) {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start) || Number.isNaN(end)) return 0;

  return Math.max(0, Math.round((end - start) / MILLISECONDS_PER_DAY));
}
