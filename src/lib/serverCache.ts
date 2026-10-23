interface CacheEntry {
  timestamp: number;
  data: any;
}

// Global in-memory cache across serverless invocations within the same process
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 Seconds TTL

// In-flight request deduplication map to prevent multiple simultaneous queries
const inFlightRequests = new Map<string, Promise<any>>();

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

export function getInFlightRequest(key: string): Promise<any> | null {
  return inFlightRequests.get(key) || null;
}

export function setInFlightRequest(key: string, promise: Promise<any>) {
  inFlightRequests.set(key, promise);
  promise.finally(() => {
    inFlightRequests.delete(key);
  });
}
