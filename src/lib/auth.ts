import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

import { getJwtSecretBytes } from "./jwtSecret";

const JWT_SECRET = getJwtSecretBytes();


export const SESSION_COOKIE_NAME = "ehrj_session_token";

const REVOKED_TOKENS_FILE = path.join(process.cwd(), "data", "security", "revoked_tokens.json");

import { atomicWriteFileSync, safeReadJsonSync } from "./storageUtils";

export function isTokenRevoked(token: string): boolean {
  try {
    const revoked = safeReadJsonSync<Array<{ token: string; revokedAt: string }>>(
      REVOKED_TOKENS_FILE,
      []
    );
    return revoked.some((r) => r.token === token);
  } catch {
    return false;
  }
}

export async function revokeToken(token: string, reason = "Session revoked") {
  try {
    const revoked = safeReadJsonSync<Array<{ token: string; revokedAt: string; reason?: string }>>(
      REVOKED_TOKENS_FILE,
      []
    );
    const MAX_REVOKED_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (JWTs naturally expire within 7 days)
    const now = Date.now();

    // Prune expired token revocations to prevent unbounded file growth
    const activeRevoked = revoked.filter(
      (r) => now - new Date(r.revokedAt).getTime() < MAX_REVOKED_AGE_MS
    );

    if (!activeRevoked.some((r) => r.token === token)) {
      activeRevoked.push({ token, revokedAt: new Date().toISOString(), reason });
    }
    atomicWriteFileSync(REVOKED_TOKENS_FILE, JSON.stringify(activeRevoked, null, 2));

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

import crypto from "crypto";

export async function createSessionToken(
  payload: SessionPayload,
  options?: { ipAddress?: string; userAgent?: string; persist?: boolean }
): Promise<string> {
  const jti = crypto.randomUUID();
  const token = await new SignJWT({ ...payload, jti })
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
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 30 });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  } catch {
    // Outside active Next.js HTTP request scope (e.g. CLI, tests, background workers)
  }
}

export async function clearAuthCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await revokeToken(token, "User Logout");
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Outside active Next.js HTTP request scope
  }
}

import { NextResponse } from "next/server";

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
          token = authHeader.substring(7).trim();
        }
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
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

  // 1. Authoritative Database Session Check
  try {
    const dbSession = await prisma.session.findUnique({
      where: { token },
      select: { id: true, expiresAt: true, userId: true },
    });

    if (!dbSession || new Date() > dbSession.expiresAt) {
      return null;
    }
  } catch (err) {
    console.error("[Auth] Database session verification error:", err);
    return null;
  }

  // 2. Verify in database that user is active and exists
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

export async function requireAdminAuth(req?: any, allowedRoles: string[] = ["ADMIN", "PRINCIPAL"]) {
  const user = await getCurrentUser(req);
  if (!user) {
    return {
      authorized: false as const,
      user: null,
      response: NextResponse.json(
        { error: "অননুমোদিত: অনুগ্রহ করে লগইন করুন (401 Unauthorized)" },
        { status: 401 }
      ),
    };
  }
  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false as const,
      user,
      response: NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস: এই কার্যক্রমে প্রবেশের প্রশাসনিক অনুমতি নেই (403 Forbidden)" },
        { status: 403 }
      ),
    };
  }
  return { authorized: true as const, user, response: null };
}

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
