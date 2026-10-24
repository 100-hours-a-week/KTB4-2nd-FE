import { clearUserLocalData } from './clearUserLocalData';

const LOCAL_DATA_OWNER_KEY = 'local-data-owner-v1';

export function syncLocalDataOwner(userId: number | null) {
  if (typeof window === 'undefined') return;

  try {
    const owner = window.localStorage.getItem(LOCAL_DATA_OWNER_KEY);
    if (userId === null || owner !== String(userId)) clearUserLocalData();
    if (userId === null) window.localStorage.removeItem(LOCAL_DATA_OWNER_KEY);
    else window.localStorage.setItem(LOCAL_DATA_OWNER_KEY, String(userId));
  } catch {
    clearUserLocalData();
  }
}
