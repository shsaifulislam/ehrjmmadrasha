import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ehrj-madrasa-digital-campus-secure-production-jwt-secret-key-2026"
);

export const SESSION_COOKIE_NAME = "ehrj_session_token";

const REVOKED_TOKENS_FILE = path.join(process.cwd(), "data", "security", "revoked_tokens.json");

function ensureRevokedTokensStore() {
  const dir = path.dirname(REVOKED_TOKENS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(REVOKED_TOKENS_FILE)) {
    fs.writeFileSync(REVOKED_TOKENS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function isTokenRevoked(token: string): boolean {
  try {
    ensureRevokedTokensStore();
    const content = fs.readFileSync(REVOKED_TOKENS_FILE, "utf-8");
    const revoked: Array<{ token: string; revokedAt: string }> = JSON.parse(content || "[]");
    return revoked.some((r) => r.token === token);
  } catch {
    return false;
  }
}

export async function revokeToken(token: string, reason = "Session revoked") {
  try {
    ensureRevokedTokensStore();
    const content = fs.readFileSync(REVOKED_TOKENS_FILE, "utf-8");
    const revoked: Array<{ token: string; revokedAt: string; reason?: string }> = JSON.parse(content || "[]");
    if (!revoked.some((r) => r.token === token)) {
      revoked.push({ token, revokedAt: new Date().toISOString(), reason });
      fs.writeFileSync(REVOKED_TOKENS_FILE, JSON.stringify(revoked, null, 2), "utf-8");
    }
    // Also remove from prisma.session
    await prisma.session.deleteMany({
      where: { token },
    });
  } catch (err) {
    console.error("Failed to revoke token:", err);
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: string;
  username: string;
  role: string;
  email: string;
  name: string;
}

export async function createSessionToken(
  payload: SessionPayload,
  options?: { ipAddress?: string; userAgent?: string; persist?: boolean }
): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  if (options?.persist !== false) {
    try {
      await prisma.session.create({
        data: {
          userId: payload.userId,
          token,
          ipAddress: options?.ipAddress || null,
          userAgent: options?.userAgent || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch {
      // Graceful fallback if database session table has concurrency/transient error
    }
  }

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (isTokenRevoked(token)) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearAuthCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeToken(token, "User Logout");
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(req?: any): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    if (req.cookies && typeof req.cookies.get === "function") {
      token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    }
    if (!token && req.headers && typeof req.headers.get === "function") {
      const cookieHeader = req.headers.get("cookie") || req.headers.get("Cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
        if (match) {
          token = match[1];
        }
      }
      if (!token) {
        const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // Outside request context
    }
  }

  if (!token) return null;

  if (isTokenRevoked(token)) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  // Verify in database that user is active and exists
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, role: true, email: true, name: true, status: true },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    name: user.name,
  };
}

export const getSessionUser = getCurrentUser;

export async function revokeAllUserSessions(userId: string, reason = "All sessions revoked") {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId },
      select: { token: true },
    });

    for (const s of sessions) {
      await revokeToken(s.token, reason);
    }

    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (err) {
    console.error("Failed to revoke all user sessions:", err);
  }
}

export async function getUserActiveSessions(userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return sessions;
  } catch {
    return [];
  }
}
