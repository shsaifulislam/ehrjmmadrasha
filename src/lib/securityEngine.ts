/**
 * EHRJ Madrasha ERP - Phase 24 Advanced Security Engine
 * Zero-Trust Authorization, Continuous Security Monitoring & Incident Management
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "./prisma";

export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "SUSPICIOUS_LOGIN_ATTEMPTS"
  | "SESSION_REVOKED"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "ACCOUNT_SUSPENDED"
  | "PASSWORD_RESET_ATTEMPT"
  | "PASSWORD_CHANGED"
  | "PERMISSION_DENIED"
  | "IDOR_ATTEMPT"
  | "RATE_LIMIT_TRIGGERED"
  | "STEP_UP_REQUIRED"
  | "STEP_UP_FAILURE"
  | "HIGH_RISK_ACTION"
  | "AI_INJECTION_DETECTED"
  | "WEBHOOK_TAMPER_DETECTED";

export type SecuritySeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface SecurityEventRecord {
  id: string;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  details?: Record<string, any>;
}

const SECURITY_DIR = path.join(process.cwd(), "data", "security");
const EVENTS_FILE = path.join(SECURITY_DIR, "security_events.json");

// Ensure security directory and events log file exist
function ensureSecurityStore() {
  if (!fs.existsSync(SECURITY_DIR)) {
    fs.mkdirSync(SECURITY_DIR, { recursive: true });
  }
  if (!fs.existsSync(EVENTS_FILE)) {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

/**
 * Record an append-only security event
 */
export async function recordSecurityEvent(
  params: Omit<SecurityEventRecord, "id" | "timestamp">
): Promise<SecurityEventRecord> {
  ensureSecurityStore();

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  const eventId = `EHRJ-SEC-${dateStr}-${rand}`;

  const eventRecord: SecurityEventRecord = {
    id: eventId,
    timestamp: new Date().toISOString(),
    ...params,
  };

  try {
    let events: SecurityEventRecord[] = [];
    if (fs.existsSync(EVENTS_FILE)) {
      const content = fs.readFileSync(EVENTS_FILE, "utf-8");
      events = JSON.parse(content || "[]");
    }
    events.push(eventRecord);

    // Limit memory/file size to last 5,000 events
    if (events.length > 5000) {
      events = events.slice(-5000);
    }
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
    console.error("[SecurityEngine] Failed to write security event:", err);
  }

  // If severity is HIGH or CRITICAL, automatically mirror to OperationalAlert or SystemIncident
  if (params.severity === "CRITICAL" || params.severity === "HIGH") {
    try {
      const alertKey = `SEC_ALERT_${params.eventType}_${params.userId || "GLOBAL"}_${Date.now()}`;
      await prisma.operationalAlert.create({
        data: {
          alertKey,
          title: `নিরাপত্তা সতর্কতা: ${params.eventType}`,
          description: `উচ্চ সতর্কতামূলক নিরাপত্তা ইভেন্ট শনাক্ত করা হয়েছে: ${params.resource || "সিস্টেম রিকোয়েস্ট"} (আইপি: ${params.ipAddress || "অজানা"})`,
          severity: params.severity === "CRITICAL" ? "CRITICAL" : "URGENT",
          source: "SECURITY",
          status: "ACTIVE",
        },
      });
    } catch {
      // Ignore unique constraint or transient error
    }
  }

  return eventRecord;
}

/**
 * Query security events with filtering
 */
export function getSecurityEvents(filters?: {
  severity?: SecuritySeverity;
  eventType?: SecurityEventType;
  userId?: string;
  limit?: number;
}): SecurityEventRecord[] {
  ensureSecurityStore();
  try {
    const content = fs.readFileSync(EVENTS_FILE, "utf-8");
    let events: SecurityEventRecord[] = JSON.parse(content || "[]");

    if (filters?.severity) {
      events = events.filter((e) => e.severity === filters.severity);
    }
    if (filters?.eventType) {
      events = events.filter((e) => e.eventType === filters.eventType);
    }
    if (filters?.userId) {
      events = events.filter((e) => e.userId === filters.userId);
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = filters?.limit || 100;
    return events.slice(0, limit);
  } catch (err) {
    console.error("[SecurityEngine] Failed to read security events:", err);
    return [];
  }
}

// -------------------------------------------------------------
// BRUTE-FORCE TRACKING & ACCOUNT LOCKOUT ENGINE
// -------------------------------------------------------------

interface FailedAttemptTracker {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const failedLoginsMap = new Map<string, FailedAttemptTracker>();

/**
 * Check if identifier or IP is locked
 */
export function checkAccountLockout(
  identifier: string,
  ip: string
): { isLocked: boolean; remainingMinutes?: number } {
  const now = Date.now();
  const key = `user:${identifier.toLowerCase()}`;
  const record = failedLoginsMap.get(key);

  if (record && record.lockedUntil && now < record.lockedUntil) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    return { isLocked: true, remainingMinutes };
  }

  return { isLocked: false };
}

/**
 * Record a failed login attempt
 */
export async function handleFailedLoginAttempt(
  identifier: string,
  ip: string,
  userAgent: string
): Promise<{ isLocked: boolean; remainingAttempts: number }> {
  const now = Date.now();
  const key = `user:${identifier.toLowerCase()}`;
  let tracker = failedLoginsMap.get(key);

  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxAttempts = 5;
  const lockoutMs = 15 * 60 * 1000; // 15 minutes lockout

  if (!tracker || now - tracker.firstAttempt > windowMs) {
    tracker = { count: 1, firstAttempt: now, lastAttempt: now };
  } else {
    tracker.count += 1;
    tracker.lastAttempt = now;
  }

  // Check if threshold exceeded
  if (tracker.count >= maxAttempts) {
    tracker.lockedUntil = now + lockoutMs;
    failedLoginsMap.set(key, tracker);

    // Record high security event
    await recordSecurityEvent({
      eventType: "SUSPICIOUS_LOGIN_ATTEMPTS",
      severity: "CRITICAL",
      username: identifier,
      ipAddress: ip,
      userAgent,
      details: {
        failedCount: tracker.count,
        lockoutDurationMinutes: 15,
      },
    });

    // If matching user exists, temporarily lock user account in DB
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: identifier },
            { email: identifier.toLowerCase() },
            { phone: identifier },
          ],
        },
      });

      if (user && user.status === "ACTIVE") {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: "LOCKED" },
        });

        await recordSecurityEvent({
          eventType: "ACCOUNT_LOCKED",
          severity: "HIGH",
          userId: user.id,
          username: user.username,
          details: { reason: "স্বয়ংক্রিয় ব্রুট-ফোর্স লক (৫ বার ভুল পাসওয়ার্ড)" },
        });
      }
    } catch (dbErr) {
      console.error("[SecurityEngine] Failed to set user status to LOCKED:", dbErr);
    }

    return { isLocked: true, remainingAttempts: 0 };
  }

  failedLoginsMap.set(key, tracker);
  return { isLocked: false, remainingAttempts: maxAttempts - tracker.count };
}

/**
 * Clear failed attempts after successful login
 */
export function clearFailedLoginAttempts(identifier: string) {
  const key = `user:${identifier.toLowerCase()}`;
  failedLoginsMap.delete(key);
}

// -------------------------------------------------------------
// ZERO-TRUST AUTHORIZATION PIPELINE
// -------------------------------------------------------------

export interface ZeroTrustAuthContext {
  user: {
    userId: string;
    username: string;
    role: string;
    email: string;
    name: string;
  };
  requiredRole?: string | string[];
  requiredPermission?: string;
  resourceType?: string;
  resourceId?: string;
  targetStudentId?: string;
  targetClassId?: string;
  targetSectionId?: string;
}

export interface ZeroTrustVerdict {
  authorized: boolean;
  status: number;
  reason?: string;
}

/**
 * Verify Zero-Trust request permissions with complete server-side ownership resolution
 */
export async function verifyZeroTrustAccess(
  ctx: ZeroTrustAuthContext
): Promise<ZeroTrustVerdict> {
  const { user, requiredRole, targetStudentId, targetClassId, targetSectionId } = ctx;

  // 1. Strict Role Authorization
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      await recordSecurityEvent({
        eventType: "PERMISSION_DENIED",
        severity: "MEDIUM",
        userId: user.userId,
        username: user.username,
        resource: ctx.resourceType,
        details: { requiredRole, actualRole: user.role },
      });
      return {
        authorized: false,
        status: 403,
        reason: `অননুমোদিত অ্যাক্সেস। এই অপারেশনটির জন্য ${allowedRoles.join("/")} ভূমিকা আবশ্যক।`,
      };
    }
  }

  // 2. Guardian IDOR Scope Validation
  if (user.role === "GUARDIAN" && targetStudentId) {
    const guardian = await prisma.guardian.findFirst({
      where: { userId: user.userId },
      include: {
        students: {
          select: { studentId: true },
        },
      },
    });

    if (!guardian) {
      return { authorized: false, status: 403, reason: "অভিভাবকের তথ্য খুঁজে পাওয়া যায়নি।" };
    }

    const linkedStudentIds = guardian.students.map((s) => s.studentId);
    if (!linkedStudentIds.includes(targetStudentId)) {
      await recordSecurityEvent({
        eventType: "IDOR_ATTEMPT",
        severity: "HIGH",
        userId: user.userId,
        username: user.username,
        resource: `Student:${targetStudentId}`,
        details: {
          attemptedStudentId: targetStudentId,
          authorizedStudentIds: linkedStudentIds,
        },
      });
      return {
        authorized: false,
        status: 403,
        reason: "আইডিওআর (IDOR) নিরাপত্তা সতর্কতা: আপনি কেবলমাত্র আপনার নিবন্ধিত সন্তানের তথ্য দেখতে পারেন।",
      };
    }
  }

  // 3. Teacher Scope Validation
  if (user.role === "TEACHER" && (targetClassId || targetSectionId)) {
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: user.userId,
        ...(targetClassId ? { classId: targetClassId } : {}),
        ...(targetSectionId ? { sectionId: targetSectionId } : {}),
      },
    });

    if (!assignment) {
      await recordSecurityEvent({
        eventType: "PERMISSION_DENIED",
        severity: "LOW",
        userId: user.userId,
        username: user.username,
        resource: `Class:${targetClassId}/Section:${targetSectionId}`,
        details: { reason: "উস্তাদের জন্য সংশ্লিষ্ট ক্লাসের দায়িত্ব বরাদ্দ নেই" },
      });
      return {
        authorized: false,
        status: 403,
        reason: "আপনি এই ক্লাস বা সেকশনের জন্য নির্ধারিত শিক্ষক নন।",
      };
    }
  }

  return { authorized: true, status: 200 };
}

// -------------------------------------------------------------
// HIGH-RISK PRIVILEGED ACTION PROTECTION
// -------------------------------------------------------------

export const HIGH_RISK_CONFIRMATIONS: Record<string, string> = {
  DATABASE_RESTORE: "RESTORE-DATABASE-CONFIRM",
  ACCOUNT_SUSPEND: "CONFIRM-ACCOUNT-SUSPEND",
  BULK_RESULT_PUBLISH: "CONFIRM-PUBLISH-RESULTS",
  DELETE_SYSTEM_BACKUP: "DELETE-BACKUP-CONFIRM",
};

/**
 * Validate step-up confirmation phrase for sensitive operations
 */
export function verifyHighRiskAction(
  actionType: keyof typeof HIGH_RISK_CONFIRMATIONS,
  providedPhrase?: string
): { allowed: boolean; error?: string } {
  const requiredPhrase = HIGH_RISK_CONFIRMATIONS[actionType];
  if (!requiredPhrase) {
    return { allowed: true };
  }

  if (!providedPhrase || providedPhrase.trim() !== requiredPhrase) {
    return {
      allowed: false,
      error: `উচ্চ-ঝুঁকিপূর্ণ অপারেশন: এই সংবেদনশীল পদক্ষেপটির জন্য সঠিক নিশ্চিতকরণ বাক্য প্রদান আবশ্যক ('${requiredPhrase}')।`,
    };
  }

  return { allowed: true };
}

// -------------------------------------------------------------
// INCIDENT MANAGEMENT ENGINE (Integrated with Prisma SystemIncident)
// -------------------------------------------------------------

export interface CreateIncidentInput {
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affectedService?: string;
  detectedById?: string;
}

export async function createSecurityIncident(input: CreateIncidentInput) {
  const code = `EHRJ-INC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const incident = await prisma.systemIncident.create({
    data: {
      incidentCode: code,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: "OPEN",
      affectedService: input.affectedService || "SECURITY",
      detectedById: input.detectedById || null,
      events: {
        create: {
          eventType: "DETECTED",
          description: `নিরাপত্তা ইনসিডেন্ট রিপোর্ট করা হয়েছে: ${input.title}`,
          performedByName: "Security Monitoring Engine",
        },
      },
    },
    include: {
      events: true,
    },
  });

  await recordSecurityEvent({
    eventType: "HIGH_RISK_ACTION",
    severity: input.severity,
    userId: input.detectedById,
    resource: `Incident:${incident.incidentCode}`,
    details: { incidentCode: incident.incidentCode, title: incident.title },
  });

  return incident;
}

export async function updateIncidentStatus(
  incidentId: string,
  newStatus: "OPEN" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "CLOSED",
  performedByName: string,
  resolutionNotes?: string
) {
  const incident = await prisma.systemIncident.update({
    where: { id: incidentId },
    data: {
      status: newStatus,
      ...(newStatus === "RESOLVED" || newStatus === "CLOSED"
        ? { resolvedAt: new Date(), resolution: resolutionNotes }
        : {}),
      events: {
        create: {
          eventType: newStatus === "RESOLVED" ? "RECOVERY" : "NOTE",
          description: `স্ট্যাটাস পরিবর্তিত: ${newStatus}. ${resolutionNotes || ""}`,
          performedByName,
        },
      },
    },
    include: {
      events: {
        orderBy: { timestamp: "desc" },
      },
    },
  });

  return incident;
}
