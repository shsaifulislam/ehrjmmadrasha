import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  validateDocumentEligibility,
  buildDocumentSnapshot,
  generateNextDocumentNumber,
  generateNextVerificationCode,
  generateDocumentQrCode,
  ensureDefaultTemplates,
} from "@/lib/documentFactory";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/documents/preview
 * Generate real-time preview data without saving to DB
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      documentType,
      sessionId,
      templateId,
      customNotes,
      selectedExamId,
      selectedReceiptId,
      selectedInvoiceId,
      transferReason,
      adminConductConfirmed,
    } = body;

    if (!studentId || !documentType) {
      return NextResponse.json(
        { error: "শিক্ষার্থী এবং প্রত্যয়নপত্রের ধরন নির্বাচন করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const eligibility = await validateDocumentEligibility(studentId, documentType, sessionId);
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    await ensureDefaultTemplates();

    let template: any = null;
    if (templateId) {
      template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
    }
    if (!template) {
      template = await prisma.documentTemplate.findFirst({
        where: { documentType, isActive: true },
        orderBy: { version: "desc" },
      });
    }

    const previewDocNumber = await generateNextDocumentNumber(documentType);
    const previewVerCode = await generateNextVerificationCode();
    const previewQr = await generateDocumentQrCode(previewVerCode);

    const snapshot = buildDocumentSnapshot({
      context: eligibility.context,
      documentNumber: previewDocNumber,
      verificationCode: previewVerCode,
      documentType,
      template,
      issueDate: new Date(),
      customNotes,
      selectedExamId,
      selectedReceiptId,
      selectedInvoiceId,
      transferReason,
      adminConductConfirmed: adminConductConfirmed ?? true,
    });

    return NextResponse.json({
      success: true,
      preview: {
        documentNumber: previewDocNumber,
        verificationCode: previewVerCode,
        documentType,
        titleBn: template?.titleBn || "অফিশিয়াল প্রত্যয়নপত্র",
        titleEn: template?.titleEn || "Official Certificate",
        qrCodeUrl: previewQr,
        parsedSnapshot: snapshot,
        issueDate: new Date().toISOString(),
        isRevoked: false,
        version: 1,
      },
    });
  } catch (error: any) {
    console.error("Preview document error:", error);
    return NextResponse.json(
      { error: error.message || "প্রিভিউ তৈরি করতে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
