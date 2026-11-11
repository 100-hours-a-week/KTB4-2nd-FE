import { toSafeReturnPath } from './authRedirect';

const STORAGE_KEY = 'login-return-path-v1';
const RETURN_PATH_TTL_MS = 15 * 60_000;

export function saveLoginReturnPath(path: string) {
  const safePath = toSafeReturnPath(path);
  if (safePath === '/' || safePath.startsWith('/login') || safePath.startsWith('/auth')) return;

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ path: safePath, savedAt: Date.now() }),
    );
  } catch {}
}

export function takeLoginReturnPath(): string {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return '/';

    const { path, savedAt } = JSON.parse(raw) as { path?: unknown; savedAt?: unknown };
    if (typeof path !== 'string' || typeof savedAt !== 'number') return '/';
    if (Date.now() - savedAt > RETURN_PATH_TTL_MS) return '/';
    return toSafeReturnPath(path);
  } catch {
    return '/';
  }
}
