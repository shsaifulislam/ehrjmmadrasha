import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { issueBatchDocuments, ensureDefaultTemplates } from "@/lib/documentFactory";

/**
 * POST /api/admin/documents/batch
 * Batch Issue Official Documents for multiple students at once
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ব্যাচ প্রত্যয়নপত্র ইস্যু করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { studentIds, documentType, sessionId, customNotes } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "অন্তত একজন শিক্ষার্থী নির্বাচন করা আবশ্যক।" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: "প্রত্যয়নপত্রের ধরন নির্বাচন করা আবশ্যক।" }, { status: 400 });
    }

    await ensureDefaultTemplates();

    const result = await issueBatchDocuments({
      studentIds,
      documentType,
      sessionId,
      issuedByUserId: user.userId,
      customNotes,
    });

    await recordAuditLog({
      userId: user.userId,
      action: "BATCH_ISSUE_OFFICIAL_DOCUMENTS",
      entityType: "Certificate",
      entityId: "BATCH",
      details: {
        documentType,
        totalRequested: studentIds.length,
        totalIssued: result.issued.length,
        totalFailed: result.failed.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${result.issued.length}টি প্রত্যয়নপত্র সফলভাবে ইস্যু করা হয়েছে।${result.failed.length > 0 ? ` (${result.failed.length}টি ব্যর্থ)` : ""}`,
      issuedCount: result.issued.length,
      failedCount: result.failed.length,
      issuedCertificates: result.issued,
      failures: result.failed,
    });
  } catch (error: any) {
    console.error("Batch issue error:", error);
    return NextResponse.json(
      { error: error.message || "ব্যাচ ইস্যু প্রক্রিয়া সম্পন্ন করা যায়নি।" },
      { status: 500 }
    );
  }
}
