import type { UserStats } from '../model/types';

const MOCK_USER_STATS: UserStats = {
  tripCount: 4,
  photoCount: 853,
  storyCount: 2,
  favoriteTripCount: 1,
  storageUsedBytes: 12_400_000_000,
  storageLimitBytes: 30_000_000_000,
};

export async function getUserStats(): Promise<UserStats> {
  return MOCK_USER_STATS;
}
