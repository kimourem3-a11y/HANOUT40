/**
 * Hanouti 40 — Safe Storage Utility
 * Prevents synchronous crashes caused by corrupted localStorage data,
 * quota exceeded errors, or restricted WebView storage environments.
 */

export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[Hanouti40] Error reading '${key}' from storage, falling back to default:`, err);
    return fallback;
  }
}

export function safeSetJSON<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[Hanouti40] Error saving '${key}' to storage:`, err);
    return false;
  }
}

export function safeGetString(key: string, fallback: string = ''): string {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const item = window.localStorage.getItem(key);
    return item !== null ? item : fallback;
  } catch {
    return fallback;
  }
}

export function safeRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[Hanouti40] Error removing '${key}' from storage:`, err);
  }
}

export function clearHanoutiCache(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [
        'hanouti40_sync_queue',
        'hanouti40_sync_devices',
        'hanouti40_notifications',
        'hanouti40_bg_settings',
      ];
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch (err) {
    console.warn('[Hanouti40] Error clearing transient cache:', err);
  }
}
