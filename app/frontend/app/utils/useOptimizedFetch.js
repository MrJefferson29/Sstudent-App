import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
      // Get all cache entries with timestamps
      const entries = await Promise.all(
        cacheKeys.map(async (key) => {
          const data = await AsyncStorage.getItem(key);
          const parsed = JSON.parse(data || '{}');
          return { key, timestamp: parsed.timestamp || 0 };
        })
      );
      
      // Sort by timestamp and remove oldest
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
const getCachedData = async (cacheKey) => {
  try {
    // Check memory cache first
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cached.duration) {
        return cached.data;
      }
      memoryCache.delete(cacheKey);
    }

    // Check AsyncStorage
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age < parsed.duration) {
        // Update memory cache
        memoryCache.set(cacheKey, parsed);
        return parsed.data;
      } else {
        // Expired, remove it
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
    const cacheData = {
      data,
      timestamp: Date.now(),
      duration,
    };
    
    // Update memory cache
    memoryCache.set(cacheKey, cacheData);
    
    // Update AsyncStorage
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    // Cleanup if needed
    if (memoryCache.size > MAX_CACHE_SIZE) {
      cleanupCache();
    }
  } catch (error) {
    console.warn('Cache write error:', error);
  }
};

// Clear cache for specific key or pattern
export const clearCache = async (pattern) => {
  try {
    if (pattern) {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(key => 
        key.startsWith(CACHE_PREFIX) && key.includes(pattern)
      );
      await AsyncStorage.multiRemove(matchingKeys);
      matchingKeys.forEach(key => memoryCache.delete(key));
    } else {
      // Clear all cache
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      memoryCache.clear();
    }
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
};

/**
 * Optimized data fetching hook with caching, request cancellation, and deduplication
 * @param {Function} fetchFn - Async function that fetches data
 * @param {Object} options - Configuration options
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {boolean} options.enabled - Whether to fetch (default: true)
 * @param {number} options.cacheDuration - Cache duration in ms (default: 5 minutes)
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @param {boolean} options.refetchOnMount - Refetch on mount even if cached (default: false)
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const abortControllerRef = useRef(null);
  const cacheKeyRef = useRef(null);
  const isMountedRef = useRef(true);

  // Generate cache key from fetch function and dependencies
  const generateCacheKey = useCallback(() => {
    const key = fetchFn.toString() + JSON.stringify(dependencies);
    return getCacheKey(key, dependencies);
  }, [fetchFn, dependencies]);

  // Fetch data with optimizations
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    const cacheKey = generateCacheKey();
    cacheKeyRef.current = cacheKey;

    // Check cache first (unless forcing refresh)
    if (useCache && !forceRefresh) {
      const cached = await getCachedData(cacheKey);
      if (cached !== null) {
        if (isMountedRef.current) {
          setData(cached);
          setIsLoading(false);
          setError(null);
        }
        
        // If refetchOnMount, fetch in background to update cache
        if (refetchOnMount) {
          fetchData(true);
        }
        return;
      }
    }

    // Request deduplication - if same request is pending, wait for it
    const requestKey = cacheKey;
    if (pendingRequests.has(requestKey)) {
      try {
        const result = await pendingRequests.get(requestKey);
        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          setError(null);
        }
        return;
      } catch (err) {
        // If pending request failed, continue with new request
      }
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Create request promise
    const requestPromise = (async () => {
      try {
        if (isMountedRef.current && !forceRefresh) {
          setIsLoading(true);
          setError(null);
        }

        // Create timeout
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, timeout);

        // Fetch data - pass signal if fetchFn accepts it
        const result = await fetchFn(abortController.signal);

        clearTimeout(timeoutId);

        if (abortController.signal.aborted) {
          throw new Error('Request cancelled');
        }

        // Cache the result
        if (useCache) {
          await setCachedData(cacheKey, result, cacheDuration);
        }

        // Remove from pending requests
        pendingRequests.delete(requestKey);

        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          setError(null);
        }

        return result;
      } catch (err) {
        pendingRequests.delete(requestKey);
        
        if (err.name === 'AbortError' || err.message === 'Request cancelled') {
          // Request was cancelled, don't update state
          return;
        }

        if (isMountedRef.current) {
          setError(err.response?.data?.message || err.message || 'Failed to fetch data');
          setIsLoading(false);
        }
        throw err;
      }
    })();

    // Store pending request
    pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }, [fetchFn, dependencies, enabled, useCache, cacheDuration, timeout, refetchOnMount, generateCacheKey]);

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Refresh function
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  // Clear cache for this query
  const clearCacheForQuery = useCallback(async () => {
    if (cacheKeyRef.current) {
      await clearCache(cacheKeyRef.current.replace(CACHE_PREFIX, ''));
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    refreshing,
    refresh,
    clearCache: clearCacheForQuery,
  };
};

/**
 * Hook for parallel fetching of multiple queries
 */
export const useParallelFetch = (queries) => {
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

