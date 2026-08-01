import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { TOKEN_CONFIG } from "@/constants";
import type { JwtPayload, AuthTokens } from "@/types";
import type { Role } from "@/constants/roles";
import { resolvePermissions } from "@/constants/roles";
import { cache } from "@/lib/redis/client";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "cinepass-access-secret-change-me";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "cinepass-refresh-secret-change-me";

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

export async function createAuthTokens(user: {
  id: string;
  email: string;
  role: Role;
  tenantId?: string;
  customPermissions?: string[];
}): Promise<AuthTokens & { sessionId: string }> {
  const sessionId = nanoid();
  const permissions = resolvePermissions(user.role, user.customPermissions);

  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions,
    sessionId,
    tenantId: user.tenantId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await cache.set(`session:${sessionId}`, user.id, 7 * 24 * 60 * 60);
  await cache.set(`refresh:${sessionId}`, refreshToken, 7 * 24 * 60 * 60);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60,
    sessionId,
  };
}

export async function rotateRefreshToken(
  oldRefreshToken: string
): Promise<(AuthTokens & { sessionId: string }) | null> {
  try {
    const payload = verifyRefreshToken(oldRefreshToken);
    const stored = await cache.get(`refresh:${payload.sessionId}`);

    if (!stored || stored !== oldRefreshToken) {
      await cache.del(`session:${payload.sessionId}`);
      await cache.del(`refresh:${payload.sessionId}`);
      return null;
    }

    await cache.del(`session:${payload.sessionId}`);
    await cache.del(`refresh:${payload.sessionId}`);

    return createAuthTokens({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
      customPermissions: payload.permissions,
    });
  } catch {
    return null;
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  await cache.del(`session:${sessionId}`);
  await cache.del(`refresh:${sessionId}`);
}

export function hashToken(token: string): string {
  return Buffer.from(token).toString("base64url").slice(0, 32);
}
