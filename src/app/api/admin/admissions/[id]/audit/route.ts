import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/admissions/:id/audit
 * Returns immutable audit logs for this application.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন অডিট হিস্ট্রি দেখতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "Application",
        entityId: id,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      auditLogs,
    });
  } catch (error: any) {
    console.error("GET /api/admin/admissions/:id/audit error:", error);
    return NextResponse.json(
      { error: "অডিট হিস্ট্রি লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
