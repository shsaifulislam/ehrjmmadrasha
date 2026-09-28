import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserActiveSessions, revokeToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/securityEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "GUARDIAN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অভিভাবক প্রবেশের অধিকার রয়েছে।" },
        { status: 403 }
      );
    }

    const sessions = await getUserActiveSessions(user.userId);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        total: sessions.length,
      },
    });
  } catch (error: any) {
    console.error("Portal Security Sessions GET Error:", error);
    return NextResponse.json(
      { error: "সেশন তালিকা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "GUARDIAN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, sessionId } = body;

    if (action === "REVOKE_SESSION") {
      if (!sessionId) {
        return NextResponse.json({ error: "সেশন আইডি আবশ্যক।" }, { status: 400 });
      }

      // Ensure the session belongs strictly to this guardian
      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: user.userId },
      });

      if (!session) {
        return NextResponse.json(
          { error: "সেশনটি খুঁজে পাওয়া যায়নি অথবা আপনি এটি বাতিল করার অধিকারী নন।" },
          { status: 404 }
        );
      }

      await revokeToken(session.token, "অভিভাবক কর্তৃক দূরবর্তী ডিভাইস লগআউট");

      await recordSecurityEvent({
        eventType: "SESSION_REVOKED",
        severity: "INFO",
        userId: user.userId,
        username: user.username,
        resource: `PortalSession:${session.id}`,
        details: { action: "GUARDIAN_REMOTE_LOGOUT" },
      });

      return NextResponse.json({
        success: true,
        message: "ডিভাইসটি সফলভাবে দূর থেকে লগআউট করা হয়েছে।",
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    console.error("Portal Security Sessions POST Error:", error);
    return NextResponse.json(
      { error: "সেশন প্রত্যাহারে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
