import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, revokeAllUserSessions, revokeToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/securityEngine";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন প্রবেশের অধিকার রয়েছে।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    const sessions = await prisma.session.findMany({
      where: {
        ...(targetUserId ? { userId: targetUserId } : {}),
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            email: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions.map((s) => ({
          id: s.id,
          userId: s.userId,
          user: s.user,
          ipAddress: s.ipAddress || "অজানা",
          userAgent: s.userAgent || "অজানা ব্রাউজার",
          createdAt: s.createdAt,
          expiresAt: s.expiresAt,
        })),
        total: sessions.length,
      },
    });
  } catch (error: any) {
    console.error("Admin Sessions GET Error:", error);
    return NextResponse.json(
      { error: "অ্যাক্টিভ সেশন তালিকা লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

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
    const { action, sessionId, userId, reason } = body;

    if (action === "REVOKE_SESSION") {
      if (!sessionId) {
        return NextResponse.json({ error: "সেশন আইডি প্রদান আবশ্যক।" }, { status: 400 });
      }

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session) {
        return NextResponse.json({ error: "সেশন খুঁজে পাওয়া যায়নি।" }, { status: 404 });
      }

      await revokeToken(session.token, reason || "অ্যাডমিন কর্তৃক সেশন প্রত্যাহার");

      await recordSecurityEvent({
        eventType: "SESSION_REVOKED",
        severity: "MEDIUM",
        userId: session.userId,
        username: session.user.username,
        resource: `Session:${session.id}`,
        details: { revokedBy: adminUser.username, reason },
      });

      await recordAuditLog({
        userId: adminUser.userId,
        action: "REVOKE_SESSION",
        entityType: "Session",
        entityId: sessionId,
        details: { targetUserId: session.userId, reason },
      });

      return NextResponse.json({
        success: true,
        message: "সেশনটি সফলভাবে প্রত্যাহার করা হয়েছে। সংশ্লিষ্ট ডিভাইসটি অবিলম্বে লগআউট হবে।",
      });
    }

    if (action === "REVOKE_ALL_USER_SESSIONS") {
      if (!userId) {
        return NextResponse.json({ error: "ব্যবহারকারী আইডি প্রদান আবশ্যক।" }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        return NextResponse.json({ error: "ব্যবহারকারী পাওয়া যায়নি।" }, { status: 404 });
      }

      await revokeAllUserSessions(userId, reason || "অ্যাডমিন কর্তৃক সমস্ত সেশন বাতিল");

      await recordSecurityEvent({
        eventType: "SESSION_REVOKED",
        severity: "HIGH",
        userId: targetUser.id,
        username: targetUser.username,
        resource: `User:${targetUser.id}:AllSessions`,
        details: { revokedBy: adminUser.username, reason },
      });

      return NextResponse.json({
        success: true,
        message: `${targetUser.name}-এর সকল সক্রিয় সেশন সফলভাবে বাতিল করা হয়েছে।`,
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Sessions POST Error:", error);
    return NextResponse.json(
      { error: "সেশন বাতিলকরণে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
