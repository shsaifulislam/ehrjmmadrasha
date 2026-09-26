import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/finance/assistance
 * Guardian submits financial assistance application for their linked child
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করা আবশ্যক।" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, sessionId, reason, isOrphan = false, familyCondition, feeCategoryTarget = "ALL" } = body;

    if (!studentId || !sessionId || !reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "শিক্ষার্থী, শিক্ষাবর্ষ এবং বিস্তারিত কারণ (কমপক্ষে ১০ অক্ষর) আবশ্যক।" },
        { status: 400 }
      );
    }

    // IDOR check: If guardian, verify child linkage
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [{ userId: user.userId }, { email: user.email }],
        },
        include: { students: true },
      });

      if (!guardian || !guardian.students.some((gs) => gs.studentId === studentId)) {
        return NextResponse.json(
          { error: "অননুমোদিত অ্যাক্সেস। আপনি কেবল আপনার সন্তানের জন্য আবেদন করতে পারেন।" },
          { status: 403 }
        );
      }
    }

    const validFrom = new Date();
    const validTo = new Date(validFrom.getTime() + 365 * 24 * 60 * 60 * 1000);

    const application = await prisma.financialAssistance.create({
      data: {
        studentId,
        sessionId,
        reason,
        isOrphan: Boolean(isOrphan),
        familyCondition: familyCondition || null,
        feeCategoryTarget,
        status: "PENDING",
        validFrom,
        validTo,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "SUBMIT_FINANCIAL_ASSISTANCE_REQUEST",
      entityType: "FinancialAssistance",
      entityId: application.id,
      details: { studentId, sessionId, isOrphan },
    });

    return NextResponse.json({
      success: true,
      message: "আর্থিক সহায়তার আবেদন সফলভাবে জমা হয়েছে। প্রশাসন পর্যালোচনা করে সিদ্ধান্ত জানাবে।",
      application,
    });
  } catch (error: any) {
    console.error("Portal assistance submit error:", error);
    return NextResponse.json({ error: error.message || "আবেদন দাখিল ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
