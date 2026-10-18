export type PendingTripKind = 'create' | 'edit';

export type PendingTrip = {
  tripId: number;
  kind: PendingTripKind;
};

const PENDING_TRIP_PROCESSING_KEY = 'trip-processing-pending-v1';

const listeners = new Set<() => void>();

function notifyChange() {
  listeners.forEach((listener) => listener());
}

function isPendingTrip(value: unknown): value is PendingTrip {
  if (typeof value !== 'object' || value === null) return false;

  const trip = value as Record<string, unknown>;
  return (
    typeof trip.tripId === 'number' &&
    Number.isSafeInteger(trip.tripId) &&
    trip.tripId > 0 &&
    (trip.kind === 'create' || trip.kind === 'edit')
  );
}

function readPendingTrips(): PendingTrip[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(PENDING_TRIP_PROCESSING_KEY) ?? '[]',
    );
    return Array.isArray(stored) ? stored.filter(isPendingTrip) : [];
  } catch {
    return [];
  }
}

function writePendingTrips(trips: PendingTrip[]) {
  if (typeof window === 'undefined') return;

  try {
    if (trips.length === 0) window.localStorage.removeItem(PENDING_TRIP_PROCESSING_KEY);
    else window.localStorage.setItem(PENDING_TRIP_PROCESSING_KEY, JSON.stringify(trips));
  } catch {
  }
  notifyChange();
}

export function addPendingTripProcessing(trip: PendingTrip) {
  const trips = readPendingTrips().filter((saved) => saved.tripId !== trip.tripId);
  writePendingTrips([...trips, trip]);
}

export function removePendingTripProcessing(tripId: number) {
  const trips = readPendingTrips();
  if (!trips.some((trip) => trip.tripId === tripId)) return;
  writePendingTrips(trips.filter((trip) => trip.tripId !== tripId));
}

export function clearPendingTripProcessing() {
  writePendingTrips([]);
}

export function getPendingTripProcessingSnapshot(): string {
  return readPendingTrips()
    .map((trip) => `${trip.kind}:${trip.tripId}`)
    .sort()
    .join(',');
}

export function parsePendingTripProcessing(snapshot: string): PendingTrip[] {
  return snapshot
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [kind, tripId] = entry.split(':');
      return { kind: kind as PendingTripKind, tripId: Number(tripId) };
    });
}

export function subscribePendingTripProcessing(listener: () => void) {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === PENDING_TRIP_PROCESSING_KEY) listener();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
}
