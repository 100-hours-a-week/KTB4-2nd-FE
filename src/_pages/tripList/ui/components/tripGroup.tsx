import { TripCard, type TripListItem } from '@/features/tripList';

export function TripGroup({
  label,
  trips,
  onFavoriteChange,
  onTripSelect,
}: {
  label?: string;
  trips: TripListItem[];
  onFavoriteChange: (tripId: number) => void;
  onTripSelect?: (tripId: number) => void;
}) {
  return (
    <section aria-label={label ?? '여행'}>
      {label && <h2 className="text-muted mb-2 px-1 text-xs font-bold">{label}</h2>}
      <ul className="space-y-2.5">
        {trips.map((trip, index) => (
          <li key={trip.id}>
            <TripCard
              trip={trip}
              colorIndex={trip.id + index}
              onFavoriteChange={onFavoriteChange}
              onTripSelect={onTripSelect}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
