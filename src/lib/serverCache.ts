interface CacheEntry {
  timestamp: number;
  data: any;
}

// Global in-memory cache across serverless invocations within the same process
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000; // 15 Seconds TTL

export function getCachedChats(key: string): any | null {
  const cached = serverCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

export function setCachedChats(key: string, data: any) {
  serverCache.set(key, { timestamp: Date.now(), data });
}

export function clearChatsCache() {
  serverCache.clear();
}
