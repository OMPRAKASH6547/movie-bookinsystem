import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { getRedis } from "@/lib/redis/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = {
    status: "ok",
    service: "cinepass-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      mongodb: "unknown",
      redis: "unknown",
    },
  };

  try {
    await connectDB();
    health.checks.mongodb = "healthy";
  } catch {
    health.checks.mongodb = "unavailable";
    health.status = "degraded";
  }

  try {
    const redis = getRedis();
    health.checks.redis = redis ? "configured" : "memory-fallback";
  } catch {
    health.checks.redis = "unavailable";
  }

  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
  });
}
