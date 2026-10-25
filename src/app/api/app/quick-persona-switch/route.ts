import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";
import { recordAuditLog, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { targetRole } = body || {};

    // 1. Safe Logout / Public mode is always permitted (deletes auth session cookie)
    if (targetRole === "PUBLIC" || targetRole === "LOGOUT") {
      const res = NextResponse.json({
        success: true,
        message: "পাবলিক ভিজিটর মোডে সফলভাবে স্থানান্তর করা হয়েছে (লগআউট সম্পন্ন)।",
      });
      res.cookies.delete("ehrj_session_token");
      return res;
    }

    // 2. CRITICAL SECURITY GUARD: Block passwordless role switching in production or non-whitelisted dev environments
    const isProduction = process.env.NODE_ENV === "production";
    const allowDevSwitch = process.env.ALLOW_DEV_PERSONA_SWITCH === "true";
    const clientIp = getClientIp(req);

    if (isProduction || !allowDevSwitch) {
      await recordAuditLog({
        action: "SECURITY_UNAUTHORIZED_ROLE_SWITCH_BLOCKED",
        entityType: "AUTH_SECURITY",
        details: {
          targetRole,
          reason: "Passwordless role switching is strictly forbidden in production or non-whitelisted mode.",
          clientIp,
        },
        ipAddress: clientIp,
      }).catch(() => {});

      return NextResponse.json(
        {
          error: "নিরাপত্তা নীতি অনুযায়ী প্রডাকশনে পাসওয়ার্ড ছাড়া রোল পরিবর্তন সম্পূর্ণ নিষিদ্ধ। অনুগ্রহ করে লগইন পেইজ থেকে বৈধ ক্রেডেনশিয়াল ব্যবহার করে লগইন করুন।",
          code: "PERSONA_SWITCH_FORBIDDEN",
        },
        { status: 403 }
      );
    }

    // 3. Isolated Development/Test Sandbox Switcher (Only when ALLOW_DEV_PERSONA_SWITCH === 'true')
    let targetEmail = "";
    if (targetRole === "ADMIN") {
      targetEmail = "admin@ehrj.edu.bd";
    } else if (targetRole === "TEACHER") {
      targetEmail = "teacherehrjmadrasha@gmail.com";
    } else if (targetRole === "GUARDIAN") {
      targetEmail = "guardian_ui_demo@ehrj.local";
    } else {
      return NextResponse.json({ error: "অবৈধ রোল নির্বাচন করা হয়েছে।" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: targetEmail },
          { role: targetRole, status: "ACTIVE" }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: "নির্দিষ্ট টেস্ট ইউজার পাওয়া যায়নি।" }, { status: 404 });
    }

    // Create session record
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await recordAuditLog({
      userId: user.id,
      action: "DEV_TEST_PERSONA_SWITCH_EXECUTED",
      entityType: "User",
      entityId: user.id,
      details: {
        role: user.role,
        environment: "SANDBOX_DEVELOPMENT",
        clientIp,
      },
      ipAddress: clientIp,
    }).catch(() => {});

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: `[স্যান্ডবক্স] ${user.role} মোডে সফলভাবে সুইচ করা হয়েছে।`,
    });

    res.cookies.set("ehrj_session_token", token, {
      httpOnly: true,
      secure: false, // dev sandbox only
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error("Error in quick persona switch:", error);
    return NextResponse.json({ error: "রোল পরিবর্তন প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" }, { status: 500 });
  }
}
