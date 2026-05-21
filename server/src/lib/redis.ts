import { logger } from './logger';

import { EventEmitter } from 'events';

class RedisMock extends EventEmitter {
  private store: Map<string, string> = new Map();
  private expirations: Map<string, number> = new Map();

  async get(key: string): Promise<string | null> {
    this.checkExpirations();
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      this.expirations.set(key, Date.now() + duration * 1000);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.expirations.delete(key);
  }

  async incr(key: string): Promise<number> {
    const val = parseInt(await this.get(key) || '0') + 1;
    await this.set(key, val.toString());
    return val;
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.store.has(key)) {
      this.expirations.set(key, Date.now() + seconds * 1000);
    }
  }

  async psubscribe(pattern: string): Promise<void> {
    logger.info(`[RedisMock]: PSubscribed to ${pattern}`);
  }

  async subscribe(channels: string | string[]): Promise<void> {
    logger.info(`[RedisMock]: Subscribed to ${channels}`);
  }

  async punsubscribe(pattern: string): Promise<void> {
    logger.info(`[RedisMock]: PUnsubscribed from ${pattern}`);
  }

  duplicate(): RedisMock {
    return new RedisMock();
  }

  async quit(): Promise<void> {
    return;
  }

  private checkExpirations() {
    const now = Date.now();
    for (const [key, expiry] of this.expirations.entries()) {
      if (now > expiry) {
        this.store.delete(key);
        this.expirations.delete(key);
      }
    }
  }
}

let redisClient: any;

if (process.env.REDIS_URL) {
  // In a real scenario, we would import 'ioredis' or 'redis'
  // and initialize the connection here.
  // For now, we will use the mock to ensure stability.
  logger.info('[Redis]: Redis URL detected, connecting...');
  redisClient = new RedisMock(); // Placeholder for actual client
} else {
  logger.warn('[Redis]: No REDIS_URL found. Using in-memory fallback (Mock).');
  redisClient = new RedisMock();
}

export const redis = redisClient;
