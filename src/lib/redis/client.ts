import Redis from "ioredis";

let redis: Redis | null = null;
const memoryStore = new Map<string, { value: string; expiry?: number }>();

function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

export function getRedis(): Redis | null {
  if (typeof window !== "undefined") return null;

  if (!redis && process.env.REDIS_URL !== "memory") {
    try {
      redis = new Redis(getRedisUrl(), {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      redis.on("error", () => {
        /* fallback to memory */
      });
    } catch {
      redis = null;
    }
  }
  return redis;
}

export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      const client = getRedis();
      if (client?.status === "ready" || client?.status === "connecting") {
        await client.connect().catch(() => null);
        if (client.status === "ready") return client.get(key);
      }
    } catch {
      /* memory fallback */
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      const client = getRedis();
      if (client?.status === "ready") {
        if (ttlSeconds) await client.setex(key, ttlSeconds, value);
        else await client.set(key, value);
        return;
      }
    } catch {
      /* memory fallback */
    }
    memoryStore.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  },

  async del(key: string): Promise<void> {
    try {
      const client = getRedis();
      if (client?.status === "ready") {
        await client.del(key);
        return;
      }
    } catch {
      /* memory fallback */
    }
    memoryStore.delete(key);
  },

  async incr(key: string): Promise<number> {
    try {
      const client = getRedis();
      if (client?.status === "ready") return client.incr(key);
    } catch {
      /* memory fallback */
    }
    const current = Number(memoryStore.get(key)?.value || 0) + 1;
    memoryStore.set(key, { value: String(current) });
    return current;
  },
};

export const seatLock = {
  key(showId: string, seatId: string) {
    return `seat_lock:${showId}:${seatId}`;
  },

  async lock(showId: string, seatId: string, userId: string, ttl = 600): Promise<boolean> {
    const key = this.key(showId, seatId);
    const existing = await cache.get(key);
    if (existing && existing !== userId) return false;
    await cache.set(key, userId, ttl);
    return true;
  },

  async unlock(showId: string, seatId: string, userId: string): Promise<void> {
    const key = this.key(showId, seatId);
    const existing = await cache.get(key);
    if (existing === userId) await cache.del(key);
  },

  async getLocks(showId: string, seatIds: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    await Promise.all(
      seatIds.map(async (seatId) => {
        result[seatId] = await cache.get(this.key(showId, seatId));
      })
    );
    return result;
  },
};
