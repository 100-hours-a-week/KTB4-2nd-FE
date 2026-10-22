export type PendingTripKind = 'create' | 'edit';

export type PendingTrip = {
  tripId: number;
  kind: PendingTripKind;
  startedAt: number;
};

const PENDING_TRIP_PROCESSING_KEY = 'trip-processing-pending-v1';

const listeners = new Set<() => void>();

function notifyChange() {
  listeners.forEach((listener) => listener());
}

function toPendingTrip(value: unknown): PendingTrip | null {
  if (typeof value !== 'object' || value === null) return null;

  const trip = value as Record<string, unknown>;
  if (
    typeof trip.tripId !== 'number' ||
    !Number.isSafeInteger(trip.tripId) ||
    trip.tripId <= 0 ||
    (trip.kind !== 'create' && trip.kind !== 'edit')
  ) {
    return null;
  }
  const startedAt = typeof trip.startedAt === 'number' ? trip.startedAt : 0;
  return { tripId: trip.tripId, kind: trip.kind, startedAt };
}

function readPendingTrips(): PendingTrip[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(PENDING_TRIP_PROCESSING_KEY) ?? '[]',
    );
    return Array.isArray(stored)
      ? stored.map(toPendingTrip).filter((trip): trip is PendingTrip => trip !== null)
      : [];
  } catch {
    return [];
  }
}

function writePendingTrips(trips: PendingTrip[]) {
  if (typeof window === 'undefined') return;

  try {
    if (trips.length === 0) window.localStorage.removeItem(PENDING_TRIP_PROCESSING_KEY);
    else window.localStorage.setItem(PENDING_TRIP_PROCESSING_KEY, JSON.stringify(trips));
  } catch {}
  notifyChange();
}

export function addPendingTripProcessing(trip: Omit<PendingTrip, 'startedAt'>) {
  const trips = readPendingTrips().filter((saved) => saved.tripId !== trip.tripId);
  writePendingTrips([...trips, { ...trip, startedAt: Date.now() }]);
}

export function removePendingTripProcessing(tripId: number, startedAt?: number) {
  const trips = readPendingTrips();
  const remaining = trips.filter(
    (trip) => trip.tripId !== tripId || (startedAt !== undefined && trip.startedAt !== startedAt),
  );
  if (remaining.length === trips.length) return;
  writePendingTrips(remaining);
}

export function clearPendingTripProcessing() {
  writePendingTrips([]);
}

export function getPendingTripProcessingKey(trip: PendingTrip) {
  return `${trip.kind}:${trip.tripId}:${trip.startedAt}`;
}

export function getPendingTripProcessingSnapshot(): string {
  return readPendingTrips().map(getPendingTripProcessingKey).sort().join(',');
}

export function parsePendingTripProcessing(snapshot: string): PendingTrip[] {
  return snapshot
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const [kind, tripId, startedAt] = entry.split(':');
      return {
        kind: kind as PendingTripKind,
        tripId: Number(tripId),
        startedAt: Number(startedAt),
      };
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
