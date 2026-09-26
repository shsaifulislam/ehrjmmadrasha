import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/admissions/:id/correction
 * Requests correction for incomplete or invalid data/documents.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন সংশোধনের অনুরোধ করতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { correctionReason } = body;

    if (!correctionReason || !correctionReason.trim()) {
      return NextResponse.json(
        { error: "সংশোধনের সুনির্দিষ্ট কারণ বা কোন কাগজপত্র প্রয়োজন তা উল্লেখ করুন।" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: "আবেদনটি খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    if (application.status === "APPROVED" || application.status === "REJECTED") {
      return NextResponse.json(
        { error: `আবেদনটি ইতিমধ্যে ${application.status} অবস্থায় রয়েছে। সংশোধন অনুরোধ সম্ভব নয়।` },
        { status: 400 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: "CORRECTION_REQUESTED",
        correctionReason: correctionReason.trim(),
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ADMISSION_CORRECTION_REQUESTED",
      entityType: "Application",
      entityId: id,
      details: {
        correctionReason: correctionReason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "আবেদনকারীর নিকট সংশোধনের অনুরোধ সফলভাবে প্রেরণ করা হয়েছে।",
      application: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/admissions/:id/correction error:", error);
    return NextResponse.json(
      { error: "সংশোধন অনুরোধ সংরক্ষণ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
