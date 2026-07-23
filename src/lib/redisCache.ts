import Redis from 'ioredis';
import { logger } from '../services/logger';

export class RedisCacheService {
  private static redisClient: Redis | null = null;
  private static memoryStore: Map<string, { value: any; expiresAt: number }> = new Map();

  private static getClient(): Redis | null {
    if (typeof window !== 'undefined') return null;

    if (!this.redisClient) {
      try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        this.redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          retryStrategy: () => null
        });

        this.redisClient.on('error', (err) => {
          logger.warn(`[RedisCache] Redis connection error (using memory fallback): ${err.message}`);
        });
      } catch (err: any) {
        logger.warn(`[RedisCache] Failed to initialize Redis client: ${err.message}`);
      }
    }
    return this.redisClient;
  }

  public static async get<T>(key: string): Promise<T | null> {
    const client = this.getClient();
    if (client) {
      try {
        const cached = await client.get(key);
        if (cached) {
          return JSON.parse(cached) as T;
        }
      } catch (e) {
      }
    }

    const item = this.memoryStore.get(key);
    if (item) {
      if (Date.now() > item.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }
      return item.value as T;
    }

    return null;
  }

  public static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const client = this.getClient();
    const serialized = JSON.stringify(value);

    if (client) {
      try {
        await client.setex(key, ttlSeconds, serialized);
      } catch (e) {
      }
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  public static async del(key: string): Promise<void> {
    const client = this.getClient();
    if (client) {
      try {
        await client.del(key);
      } catch (e) {}
    }
    this.memoryStore.delete(key);
  }

  public static async remember<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshValue = await fetcher();
    await this.set(key, freshValue, ttlSeconds);
    return freshValue;
  }
}
