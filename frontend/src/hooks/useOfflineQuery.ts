import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, writeCache } from '../services/cache';
import { useConnectivityStore } from '../store/connectivityStore';

interface Options {
  /** Cache key — omit to disable caching */
  cacheKey?: string;
  /** Load on mount (default true) */
  immediate?: boolean;
}

interface Result<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  /** Data came from the offline cache */
  fromCache: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * Stale-while-revalidate data hook:
 * 1. render cached data instantly (offline support),
 * 2. fetch fresh data in the background,
 * 3. keep the cached version if the network fails.
 */
export function useOfflineQuery<T>(
  fetcher: () => Promise<T>,
  options: Options = {}
): Result<T> {
  const { cacheKey, immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const setUsingCache = useConnectivityStore((s) => s.setUsingCache);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true);

      // 1 — cache first
      if (mode === 'initial' && cacheKey) {
        const cached = await readCache<T>(cacheKey);
        if (cached && mounted.current) {
          setData(cached.data);
          setFromCache(true);
          setLoading(false);
        }
      }

      // 2 — network
      try {
        const fresh = await fetcherRef.current();
        if (!mounted.current) return;
        setData(fresh);
        setError(null);
        setFromCache(false);
        setUsingCache(false);
        if (cacheKey) await writeCache(cacheKey, fresh);
      } catch (err) {
        if (!mounted.current) return;
        const message = err instanceof Error ? err.message : 'Une erreur est survenue';
        setError(message);
        // 3 — fall back to cache
        if (cacheKey) {
          const cached = await readCache<T>(cacheKey);
          if (cached && mounted.current) {
            setData(cached.data);
            setFromCache(true);
            setUsingCache(true);
            setError(null);
          }
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [cacheKey, setUsingCache]
  );

  useEffect(() => {
    if (immediate) void run('initial');
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return {
    data,
    loading,
    refreshing,
    error,
    fromCache,
    refresh: () => run('refresh'),
    reload: () => run('initial'),
    setData,
  };
}

export default useOfflineQuery;
