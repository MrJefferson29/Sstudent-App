import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration
const CACHE_PREFIX = '@app_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default
const MAX_CACHE_SIZE = 50; // Maximum number of cached items

// In-memory cache for faster access
const memoryCache = new Map();
const pendingRequests = new Map(); // Request deduplication

// Clean up old cache entries
const cleanupCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

    if (cacheKeys.length > MAX_CACHE_SIZE) {
      const entries = await Promise.all(
        cacheKeys.map(async key => {
          const data = await AsyncStorage.getItem(key);
          const parsed = JSON.parse(data || '{}');
          return { key, timestamp: parsed.timestamp || 0 };
        })
      );
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
      await AsyncStorage.multiRemove(toRemove.map(e => e.key));
    }
  } catch (error) {
    console.warn('Cache cleanup error:', error);
  }
};

// Generate cache key from params
const getCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${CACHE_PREFIX}${url}_${sortedParams}`;
};

// Get from cache
const getCachedData = async cacheKey => {
  try {
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cached.duration) return cached.data;
      memoryCache.delete(cacheKey);
    }

    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      if (age < parsed.duration) {
        memoryCache.set(cacheKey, parsed);
        return parsed.data;
      } else {
        await AsyncStorage.removeItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn('Cache read error:', error);
  }
  return null;
};

// Save to cache
const setCachedData = async (cacheKey, data, duration = CACHE_DURATION) => {
  try {
    const cacheData = { data, timestamp: Date.now(), duration };
    memoryCache.set(cacheKey, cacheData);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    if (memoryCache.size > MAX_CACHE_SIZE) cleanupCache();
  } catch (error) {
    console.warn('Cache write error:', error);
  }
};

// Clear cache
export const clearCache = async pattern => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    const matchingKeys = pattern
      ? cacheKeys.filter(key => key.includes(pattern))
      : cacheKeys;
    await AsyncStorage.multiRemove(matchingKeys);
    matchingKeys.forEach(key => memoryCache.delete(key));
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
};

/**
 * Optimized fetch hook with caching, offline support, and deduplication
 */
export const useOptimizedFetch = (fetchFn, dependencies = [], options = {}) => {
  const {
    enabled = true,
    cacheDuration = CACHE_DURATION,
    useCache = true,
    timeout = 30000,
    refetchOnMount = false,
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(!useCache);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const abortControllerRef = useRef(null);
  const cacheKeyRef = useRef(null);
  const isMountedRef = useRef(true);

  const generateCacheKey = useCallback(() => {
    return getCacheKey('api_fetch', dependencies);
  }, [dependencies]);

  const fetchData = useCallback(
    async forceRefresh => {
      if (!enabled) return;
      const cacheKey = generateCacheKey();
      cacheKeyRef.current = cacheKey;

      // Try to get cached data first
      if (useCache && !forceRefresh) {
        const cached = await getCachedData(cacheKey);
        if (cached !== null) {
          if (isMountedRef.current) {
            setData(cached);
            setIsLoading(false);
            setError(null);
          }
          // Only refetch if explicitly requested and online
          if (refetchOnMount && navigator.onLine) fetchData(true);
          return;
        }
      }

      // Deduplicate requests
      if (pendingRequests.has(cacheKey)) {
        try {
          const result = await pendingRequests.get(cacheKey);
          if (isMountedRef.current) {
            setData(result);
            setIsLoading(false);
            setError(null);
          }
          return;
        } catch {}
      }

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const requestPromise = (async () => {
        try {
          if (isMountedRef.current && !forceRefresh) setIsLoading(true);

          const timeoutId = setTimeout(() => abortController.abort(), timeout);
          const result = await fetchFn(abortController.signal);
          clearTimeout(timeoutId);

          if (abortController.signal.aborted) throw new Error('Request cancelled');

          if (useCache) await setCachedData(cacheKey, result, cacheDuration);
          pendingRequests.delete(cacheKey);

          if (isMountedRef.current) {
            setData(result);
            setIsLoading(false);
            setError(null);
          }

          return result;
        } catch (err) {
          pendingRequests.delete(cacheKey);
          if (
            err.name === 'AbortError' ||
            err.name === 'CanceledError' ||
            err.message === 'Request cancelled' ||
            err.message === 'canceled'
          )
            return;

          if (isMountedRef.current) {
            // Offline fallback: show cached data if available
            const cached = await getCachedData(cacheKey);
            if (cached !== null) {
              setData(cached);
              setError(null);
              setIsLoading(false);
            } else {
              setError(err.response?.data?.message || err.message || 'Failed to fetch data');
              setIsLoading(false);
            }
          }

          throw err;
        }
      })();

      pendingRequests.set(cacheKey, requestPromise);
      return requestPromise;
    },
    [
      fetchFn,
      dependencies,
      enabled,
      useCache,
      cacheDuration,
      timeout,
      refetchOnMount,
      generateCacheKey,
    ]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const clearCacheForQuery = useCallback(async () => {
    if (cacheKeyRef.current) {
      await clearCache(cacheKeyRef.current.replace(CACHE_PREFIX, ''));
    }
  }, []);

  return { data, isLoading, error, refreshing, refresh, clearCache: clearCacheForQuery };
};

/**
 * Parallel fetch hook
 */
export const useParallelFetch = queries => {
  const results = queries.map(({ fetchFn, dependencies, options }) =>
    useOptimizedFetch(fetchFn, dependencies, options)
  );

  return {
    results,
    isLoading: results.some(r => r.isLoading),
    hasError: results.some(r => r.error),
    refreshAll: async () => {
      await Promise.all(results.map(r => r.refresh()));
    },
  };
};
