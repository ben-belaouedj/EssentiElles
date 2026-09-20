/**
 * Offline-first cache layer (AsyncStorage).
 * Products, categories and subscriptions are cached so the app stays
 * usable without a connection (stale-while-revalidate).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'livrella_cache:';

export interface CacheEntry<T> {
  data: T;
  savedAt: number;
}

export async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.savedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `${PREFIX}${key}`,
      JSON.stringify({ data, savedAt: Date.now() } satisfies CacheEntry<T>)
    );
  } catch {
    /* storage full or unavailable — the app still works from network */
  }
}

export async function clearCache(keys?: string[]): Promise<void> {
  try {
    if (keys?.length) {
      await AsyncStorage.removeMany(keys.map((key) => `${PREFIX}${key}`));
      return;
    }
    const all = await AsyncStorage.getAllKeys();
    await AsyncStorage.removeMany(all.filter((key) => key.startsWith(PREFIX)));
  } catch {
    /* ignore */
  }
}
