import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/hostel/rules
 * Returns residential rules for the active or requested academic session.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    let sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      const current = await prisma.academicSession.findFirst({ where: { isCurrent: true } });
      if (current) sessionId = current.id;
    }

    if (!sessionId) {
      return NextResponse.json({ error: "কোনো শিক্ষাবর্ষ পাওয়া যায়নি।" }, { status: 404 });
    }

    let rule = await prisma.residentialRule.findUnique({
      where: { sessionId },
      include: { session: true },
    });

    if (!rule) {
      // Default rule creation
      rule = await prisma.residentialRule.create({
        data: {
          sessionId,
          monthlyHostelFee: 1500,
          monthlyFoodFee: 2000,
          admissionHostelFee: 1000,
          dayCareFoodExempt: true,
          allowGuardianRequest: true,
          checkInNoticeDays: 3,
          rulesNotesBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা কেন্দ্রীয় দারুল ইকামা নীতিমালা।",
        },
        include: { session: true },
      });
    }

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    console.error("GET /api/admin/hostel/rules error:", error);
    return NextResponse.json(
      { error: error.message || "নীতিমালা লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/hostel/rules
 * Updates residential rules.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      sessionId,
      monthlyHostelFee,
      monthlyFoodFee,
      admissionHostelFee,
      dayCareFoodExempt = true,
      allowGuardianRequest = true,
      checkInNoticeDays = 3,
      rulesNotesBn,
    } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "সেশন আইডি আবশ্যক।" }, { status: 400 });
    }

    const rule = await prisma.residentialRule.upsert({
      where: { sessionId },
      create: {
        sessionId,
        monthlyHostelFee: Number(monthlyHostelFee) || 1500,
        monthlyFoodFee: Number(monthlyFoodFee) || 2000,
        admissionHostelFee: Number(admissionHostelFee) || 1000,
        dayCareFoodExempt: !!dayCareFoodExempt,
        allowGuardianRequest: !!allowGuardianRequest,
        checkInNoticeDays: Number(checkInNoticeDays) || 3,
        rulesNotesBn,
      },
      update: {
        monthlyHostelFee: monthlyHostelFee !== undefined ? Number(monthlyHostelFee) : undefined,
        monthlyFoodFee: monthlyFoodFee !== undefined ? Number(monthlyFoodFee) : undefined,
        admissionHostelFee: admissionHostelFee !== undefined ? Number(admissionHostelFee) : undefined,
        dayCareFoodExempt: dayCareFoodExempt !== undefined ? !!dayCareFoodExempt : undefined,
        allowGuardianRequest: allowGuardianRequest !== undefined ? !!allowGuardianRequest : undefined,
        checkInNoticeDays: checkInNoticeDays !== undefined ? Number(checkInNoticeDays) : undefined,
        rulesNotesBn: rulesNotesBn !== undefined ? rulesNotesBn : undefined,
      },
      include: { session: true },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "UPDATE",
      entityType: "ResidentialRule",
      entityId: rule.id,
      details: { sessionId, monthlyHostelFee, monthlyFoodFee },
    });

    return NextResponse.json({
      success: true,
      message: "হোস্টেল নীতিমালা সফলভাবে সংরক্ষিত হয়েছে।",
      rule,
    });
  } catch (error: any) {
    console.error("PUT /api/admin/hostel/rules error:", error);
    return NextResponse.json(
      { error: error.message || "নীতিমালা সংরক্ষণে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
