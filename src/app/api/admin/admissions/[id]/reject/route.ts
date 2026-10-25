import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/admissions/:id/reject
 * Rejects admission with mandatory justification.
 * Invariants:
 * 1. Requires reason.
 * 2. Never deletes application (preserves history).
 * 3. Cannot reject already approved application.
 * 4. Immutable audit trail.
 */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন আবেদন বাতিল করতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { rejectionReason } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { error: "আবেদন বাতিল করার সুনির্দিষ্ট কারণ উল্লেখ করা বাধ্যতামূলক।" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "আবেদনটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    if (application.status === "APPROVED") {
      return NextResponse.json(
        { error: "ইতিমধ্যে অনুমোদিত শিক্ষার্থী আবেদন বাতিল করা সম্ভব নয়। শিক্ষার্থী ব্যবস্থাপনা থেকে কার্যক্রম পরিচালনা করুন।" },
        { status: 400 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
        rejectedAt: new Date(),
        rejectedByUserId: user.userId,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ADMISSION_REJECT",
      entityType: "Application",
      entityId: id,
      details: {
        rejectionReason: rejectionReason.trim(),
        rejectedBy: user.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ভর্তি আবেদনটি বাতিল করা হয়েছে এবং কারণ সংরক্ষণ করা হয়েছে।",
      application: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/admissions/:id/reject error:", error);
    return NextResponse.json(
      { error: "আবেদন বাতিল কার্যক্রমে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
