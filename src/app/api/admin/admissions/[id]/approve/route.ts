import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { approveAdmissionTransaction } from "@/lib/admissionApproval";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/admissions/:id/approve
 * Executes the complete transactional approval workflow.
 */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন আবেদন অনুমোদন করতে পারেন।" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { assignedSectionId, linkExistingStudentId, approvalNotes, customAdmissionFee } = body;

    const result = await approveAdmissionTransaction({
      applicationId: id,
      adminUserId: user.userId,
      assignedSectionId,
      linkExistingStudentId,
      approvalNotes,
      customAdmissionFee,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/admin/admissions/:id/approve error:", error);
    const status = error.statusCode || (error.message?.includes("ইতিমধ্যে অনুমোদিত") ? 409 : 500);
    return NextResponse.json(
      { error: error.message || "ভর্তি অনুমোদন কার্যক্রমে সমস্যা হয়েছে।" },
      { status }
    );
  }
}
