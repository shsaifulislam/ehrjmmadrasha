import { prisma } from "./prisma";

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
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
