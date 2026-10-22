export function formatShortDate(date: string) {
  return date.slice(2).replaceAll('-', '.');
}
