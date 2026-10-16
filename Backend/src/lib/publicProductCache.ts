type CacheEntry = { expiresAt: number; value: unknown };

const entries = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<unknown>>();
const TTL_MS = 60_000;
const MAX_ENTRIES = 100;
let generation = 0;

export function getPublicProductCache<T>(key: string): T | undefined {
  const entry = entries.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    entries.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setPublicProductCache<T>(key: string, value: T): void {
  if (entries.size >= MAX_ENTRIES) {
    const oldestKey = entries.keys().next().value;
    if (oldestKey) entries.delete(oldestKey);
  }
  entries.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export async function loadPublicProductCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = getPublicProductCache<T>(key);
  if (cached !== undefined) return cached;
  const current = pending.get(key);
  if (current) return current as Promise<T>;

  const startedAtGeneration = generation;
  const request = loader().then((value) => {
    if (startedAtGeneration === generation) setPublicProductCache(key, value);
    return value;
  }).finally(() => {
    if (pending.get(key) === request) pending.delete(key);
  });
  pending.set(key, request);
  return request;
}

export function invalidatePublicProductCache(): void {
  generation += 1;
  entries.clear();
  pending.clear();
}
