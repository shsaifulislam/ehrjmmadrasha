import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/scholarships/assign
 * Assign a scholarship to a student for a specific session and validity period
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { scholarshipId, studentId, sessionId, effectiveMonths = 12 } = body;

    if (!scholarshipId || !studentId || !sessionId) {
      return NextResponse.json({ error: "বৃত্তি, শিক্ষার্থী এবং সেশন আইডি আবশ্যক।" }, { status: 400 });
    }

    const effectiveFrom = new Date();
    const effectiveTo = new Date(effectiveFrom.getTime() + Number(effectiveMonths) * 30 * 24 * 60 * 60 * 1000);

    const allocation = await prisma.studentScholarship.upsert({
      where: {
        scholarshipId_studentId_sessionId: {
          scholarshipId,
          studentId,
          sessionId,
        },
      },
      update: {
        effectiveFrom,
        effectiveTo,
        approvedByUserId: user.userId,
      },
      create: {
        scholarshipId,
        studentId,
        sessionId,
        effectiveFrom,
        effectiveTo,
        approvedByUserId: user.userId,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ASSIGN_SCHOLARSHIP",
      entityType: "StudentScholarship",
      entityId: allocation.id,
      details: { scholarshipId, studentId, sessionId },
    });

    return NextResponse.json({
      success: true,
      message: "শিক্ষার্থীকে মেধাবৃত্তি সফলভাবে বরাদ্দ করা হয়েছে।",
      allocation,
    });
  } catch (error: any) {
    console.error("Scholarship assign error:", error);
    return NextResponse.json({ error: error.message || "বৃত্তি বরাদ্দ ব্যর্থ।" }, { status: 500 });
  }
}
