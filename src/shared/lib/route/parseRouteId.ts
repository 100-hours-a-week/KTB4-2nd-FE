const ROUTE_ID_PATTERN = /^[1-9]\d*$/;

export function parseRouteId(value: string): number | null {
  if (!ROUTE_ID_PATTERN.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}
