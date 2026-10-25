import { prisma } from "./prisma";

// In-memory sliding window rate limiter with TTL eviction and bounded capacity
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_RATE_LIMIT_ENTRIES = 5000;
let lastRateLimitCleanup = Date.now();

function purgeExpiredRateLimits(now: number) {
  rateLimitMap.forEach((v, k) => {
    if (now > v.resetAt) {
      rateLimitMap.delete(k);
    }
  });
}

export function checkRateLimit(key: string, limit: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Opportunistic cleanup every 30s or when approaching capacity
  if (now - lastRateLimitCleanup > 30000 || rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    purgeExpiredRateLimits(now);
    lastRateLimitCleanup = now;

    // If still at capacity after purging expired keys, evict oldest FIFO entry
    if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldestKey = rateLimitMap.keys().next().value;
      if (oldestKey) rateLimitMap.delete(oldestKey);
    }
  }

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

export function resetRateLimit(key?: string) {
  if (key) {
    rateLimitMap.delete(key);
  } else {
    rateLimitMap.clear();
  }
}

/**
 * SEC-03: Admission Intake Rate Limiter
 * Baseline: Maximum 5 applications per normalized client IP per hour (3,600,000 ms).
 */
export function checkAdmissionRateLimit(clientIp: string): { allowed: boolean; remaining: number } {
  const normalizedIp = (clientIp || "127.0.0.1").trim().toLowerCase();
  return checkRateLimit(`admission:${normalizedIp}`, 5, 60 * 60 * 1000);
}

/**
 * Extracts normalized client IP from trusted reverse proxy headers without trusting arbitrary spoofing.
 */
export function getClientIp(req: { headers: { get: (name: string) => string | null } }): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  return "127.0.0.1";
}

export async function recordAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    let validUserId: string | null = null;
    let auditDetails = details ? { ...details } : {};

    if (userId) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ id: userId }, { username: userId }] },
        select: { id: true },
      });
      if (user) {
        validUserId = user.id;
      } else {
        auditDetails = { ...auditDetails, actor: userId };
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: validUserId,
        action,
        entityType,
        entityId: entityId || null,
        detailsJson: Object.keys(auditDetails).length > 0 ? JSON.stringify(auditDetails) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
