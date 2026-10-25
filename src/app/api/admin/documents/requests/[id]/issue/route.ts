import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { issueOfficialDocument } from "@/lib/documentFactory";

/**
 * POST /api/admin/documents/requests/[id]/issue
 * Issue the official document for an approved request
 */
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন প্রত্যয়নপত্র ইস্যু করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;

    const request = await prisma.documentRequest.findUnique({
      where: { id },
      include: {
        feeInvoice: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "আবেদনটি পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check if fee invoice exists and is unpaid
    if (request.feeInvoice && request.feeInvoice.status !== "PAID" && request.feeInvoice.status !== "WAIVED") {
      return NextResponse.json(
        { error: `এই প্রত্যয়নপত্রের ফি (ইনভয়েস: ${request.feeInvoice.invoiceNumber}) এখনো অপরিশোধিত রয়েছে। ইস্যু করার পূর্বে ফি পরিশোধ নিশ্চিত করুন।` },
        { status: 400 }
      );
    }

    const cert = await issueOfficialDocument({
      studentId: request.studentId,
      documentType: request.documentType,
      sessionId: request.sessionId || undefined,
      requestId: request.id,
      issuedByUserId: user.userId,
      customNotes: request.purpose,
    });

    await recordAuditLog({
      userId: user.userId,
      action: "ISSUE_REQUESTED_DOCUMENT",
      entityType: "Certificate",
      entityId: cert.id,
      details: {
        requestId: request.id,
        requestNumber: request.requestNumber,
        certificateNumber: cert.certificateNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: "প্রত্যয়নপত্র সফলভাবে প্রস্তুত ও ইস্যু করা হয়েছে।",
      certificate: cert,
    });
  } catch (error: any) {
    console.error("Admin Document Request Issue error:", error);
    return NextResponse.json(
      { error: error.message || "প্রত্যয়নপত্র ইস্যু করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
