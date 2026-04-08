// Simple in-memory cache for API responses with TTL (Time To Live)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const cache: Record<string, CacheEntry<any>> = {};

export const cacheGet = <T>(key: string): T | null => {
  const entry = cache[key];
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > entry.ttlMs) {
    delete cache[key];
    return null;
  }
  
  return entry.data as T;
};

export const cacheSet = <T>(key: string, data: T, ttlMs: number = 5000): void => {
  cache[key] = {
    data,
    timestamp: Date.now(),
    ttlMs,
  };
};

export const cacheClear = (key?: string): void => {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
};

// Utility to check if we have fresh cached data
export const hasFreshCache = (key: string): boolean => {
  const entry = cache[key];
  if (!entry) return false;
  
  const age = Date.now() - entry.timestamp;
  return age <= entry.ttlMs;
};

// Cache keys for different endpoints
export const CACHE_KEYS = {
  CONSULTATIONS: 'consultations_list',
  COMMENTED_CONSULTATIONS: 'commented_consultations_list',
  CONSULTATION_DETAIL: (id: string) => `consultation_${id}`,
  CONSULTATION_COMMENTS: (id: string) => `consultation_${id}_comments`,
  PROFILE: 'user_profile',
  STATS: 'user_stats',
};
