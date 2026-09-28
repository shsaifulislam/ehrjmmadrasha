import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, revokeAllUserSessions, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent, verifyHighRiskAction } from "@/lib/securityEngine";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getCurrentUser(req);
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন প্রবেশের অধিকার রয়েছে।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, userId, confirmationPhrase, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "ইউজার আইডি আবশ্যক।" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "ব্যবহারকারী খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    // Protect self from lock or suspension
    if (targetUser.id === adminUser.userId) {
      return NextResponse.json(
        { error: "অ্যাডমিন নিজের অ্যাকাউন্ট লক বা স্থগিত করতে পারবেন না।" },
        { status: 400 }
      );
    }

    // 1. UNLOCK ACCOUNT (e.g. after brute force lock)
    if (action === "UNLOCK_ACCOUNT") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });

      await recordSecurityEvent({
        eventType: "ACCOUNT_UNLOCKED",
        severity: "INFO",
        userId: targetUser.id,
        username: targetUser.username,
        resource: `User:${targetUser.id}`,
        details: { unlockedBy: adminUser.username },
      });

      await recordAuditLog({
        userId: adminUser.userId,
        action: "UNLOCK_ACCOUNT",
        entityType: "User",
        entityId: userId,
      });

      return NextResponse.json({
        success: true,
        message: `${targetUser.name}-এর অ্যাকাউন্ট সফলভাবে আনলক করা হয়েছে।`,
      });
    }

    // 2. LOCK ACCOUNT
    if (action === "LOCK_ACCOUNT") {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "LOCKED" },
      });

      // Revoke all active sessions immediately
      await revokeAllUserSessions(userId, "অ্যাকাউন্ট লক হওয়ার কারণে সেশন বাতিল");

      await recordSecurityEvent({
        eventType: "ACCOUNT_LOCKED",
        severity: "HIGH",
        userId: targetUser.id,
        username: targetUser.username,
        resource: `User:${targetUser.id}`,
        details: { lockedBy: adminUser.username },
      });

      await recordAuditLog({
        userId: adminUser.userId,
        action: "LOCK_ACCOUNT",
        entityType: "User",
        entityId: userId,
      });

      return NextResponse.json({
        success: true,
        message: `${targetUser.name}-এর অ্যাকাউন্ট সফলভাবে লক করা হয়েছে এবং সকল সক্রিয় সেশন বাতিল করা হয়েছে।`,
      });
    }

    // 3. SUSPEND ACCOUNT (High Risk - Requires Confirmation)
    if (action === "SUSPEND_ACCOUNT") {
      const stepUp = verifyHighRiskAction("ACCOUNT_SUSPEND", confirmationPhrase);
      if (!stepUp.allowed) {
        return NextResponse.json({ error: stepUp.error }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });

      await revokeAllUserSessions(userId, "অ্যাকাউন্ট স্থগিত হওয়ার কারণে সেশন বাতিল");

      await recordSecurityEvent({
        eventType: "ACCOUNT_SUSPENDED",
        severity: "CRITICAL",
        userId: targetUser.id,
        username: targetUser.username,
        resource: `User:${targetUser.id}`,
        details: { suspendedBy: adminUser.username, confirmationPhraseVerified: true },
      });

      await recordAuditLog({
        userId: adminUser.userId,
        action: "SUSPEND_ACCOUNT",
        entityType: "User",
        entityId: userId,
      });

      return NextResponse.json({
        success: true,
        message: `${targetUser.name}-এর অ্যাকাউন্ট সফলভাবে স্থগিত করা হয়েছে।`,
      });
    }

    // 4. FORCE PASSWORD RESET
    if (action === "FORCE_PASSWORD_RESET") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" }, { status: 400 });
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Revoke all existing sessions so old credentials can no longer be used
      await revokeAllUserSessions(userId, "পাসওয়ার্ড রিসেট হওয়ার কারণে পুরাতন সেশন বাতিল");

      await recordSecurityEvent({
        eventType: "PASSWORD_CHANGED",
        severity: "MEDIUM",
        userId: targetUser.id,
        username: targetUser.username,
        resource: `User:${targetUser.id}`,
        details: { resetBy: adminUser.username },
      });

      return NextResponse.json({
        success: true,
        message: `${targetUser.name}-এর পাসওয়ার্ড সফলভাবে হালনাগাদ করা হয়েছে এবং পূর্বের সকল সেশন বাতিল করা হয়েছে।`,
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    console.error("Security Accounts POST Error:", error);
    return NextResponse.json(
      { error: "অ্যাকাউন্ট নিরাপত্তা অপারেশনে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
