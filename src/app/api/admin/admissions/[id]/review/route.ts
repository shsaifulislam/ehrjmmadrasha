import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/admissions/:id/review
 * Transitions application from SUBMITTED / CORRECTION_REQUESTED -> UNDER_REVIEW.
 */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন আবেদন পর্যালোচনা শুরু করতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { reviewNotes } = body;

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "আবেদনটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    if (application.status === "APPROVED" || application.status === "REJECTED") {
      return NextResponse.json(
        { error: `আবেদনটির বর্তমান অবস্থা (${application.status}) বিধায় পুনরায় রিভিউতে নেওয়া সম্ভব নয়।` },
        { status: 400 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "UNDER_REVIEW",
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || application.reviewNotes,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ADMISSION_START_REVIEW",
      entityType: "Application",
      entityId: id,
      details: {
        previousStatus: application.status,
        newStatus: "UNDER_REVIEW",
        reviewNotes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "আবেদনটি সফলভাবে পর্যালোচনাধীন (UNDER_REVIEW) অবস্থায় নেওয়া হয়েছে।",
      application: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/admissions/:id/review error:", error);
    return NextResponse.json(
      { error: "রিভিউ প্রক্রিয়া শুরু করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
