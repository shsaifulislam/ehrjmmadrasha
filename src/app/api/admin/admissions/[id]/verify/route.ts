import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/admissions/:id/verify
 * Records document & data verification results and transitions status to VERIFICATION.
 */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন যাচাইকরণ সম্পন্ন করতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { verificationStatus = "VERIFIED", verificationNotes } = body;

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
        status: "VERIFICATION",
        verificationStatus,
        verificationNotes: verificationNotes || null,
        verifiedByUserId: user.userId,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ADMISSION_VERIFICATION",
      entityType: "Application",
      entityId: id,
      details: {
        verificationStatus,
        verificationNotes,
        verifiedBy: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `আবেদনের তথ্য ও কাগজপত্র সফলভাবে যাচাই করা হয়েছে (${verificationStatus})।`,
      application: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/admissions/:id/verify error:", error);
    return NextResponse.json(
      { error: "যাচাইকরণ ফলাফল সংরক্ষণ করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
