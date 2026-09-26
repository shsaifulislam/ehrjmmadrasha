import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/admissions/:id/exam-interview
 * Schedules exam/interview or records pass/fail result.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন পরীক্ষা/মৌখিক সাক্ষাতকার পরিচালনা করতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { scheduledAt, result } = body; // result: PASS | FAIL | null

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "আবেদনটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    if (application.status === "APPROVED" || application.status === "REJECTED") {
      return NextResponse.json(
        { error: `আবেদনটি ইতিমধ্যে ${application.status} অবস্থায় রয়েছে।` },
        { status: 400 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "EXAM_INTERVIEW",
        ...(scheduledAt !== undefined
          ? { examInterviewScheduledAt: scheduledAt ? new Date(scheduledAt) : null }
          : {}),
        ...(result !== undefined ? { examInterviewResult: result } : {}),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ADMISSION_EXAM_INTERVIEW",
      entityType: "Application",
      entityId: id,
      details: {
        scheduledAt,
        result,
      },
    });

    return NextResponse.json({
      success: true,
      message: "পরীক্ষা / মৌখিক সাক্ষাতকার সংক্রান্ত তথ্য সফলভাবে সংরক্ষিত হয়েছে।",
      application: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/admissions/:id/exam-interview error:", error);
    return NextResponse.json(
      { error: "পরীক্ষা/সাক্ষাতকার তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
