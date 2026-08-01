import { NextRequest } from "next/server";
import { cache } from "@/lib/redis/client";
import { errorResponse } from "@/utils/api-response";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export async function rateLimit(req: NextRequest, config: RateLimitConfig) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const key = `${config.keyPrefix || "rl"}:${ip}`;
  const count = await cache.incr(key);

  if (count === 1) {
    await cache.set(key, "1", Math.ceil(config.windowMs / 1000));
  }

  if (count > config.max) {
    return errorResponse("Too many requests. Please try again later.", 429);
  }

  return null;
}
