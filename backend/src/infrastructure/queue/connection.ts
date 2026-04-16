import { Redis, RedisOptions } from "ioredis";
import { env } from "@/config/env";

// BullMQ requires `maxRetriesPerRequest: null` on the shared connection.
const baseOpts: RedisOptions = { maxRetriesPerRequest: null };

export const redisConnection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, baseOpts)
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      ...baseOpts,
    });
