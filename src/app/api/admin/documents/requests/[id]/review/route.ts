import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { calculateStudentFee, generateNextInvoiceNumber } from "@/lib/feeCalculationService";

/**
 * POST /api/admin/documents/requests/[id]/review
 * Review, approve, or reject a document request
 */
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন আবেদন পর্যালোচনা করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { action, rejectionReason, requiresFeeInvoice = false } = body; // APPROVE, REJECT, UNDER_REVIEW

    const request = await prisma.documentRequest.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!request) {
      return NextResponse.json({ error: "আবেদনটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (action === "REJECT") {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({ error: "প্রত্যাখ্যানের কারণ উল্লেখ করা আবশ্যক।" }, { status: 400 });
      }

      const updated = await prisma.documentRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason.trim(),
          reviewedByUserId: user.userId,
          reviewedAt: new Date(),
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "REJECT_DOCUMENT_REQUEST",
        entityType: "DocumentRequest",
        entityId: id,
        details: { reason: rejectionReason.trim() },
      });

      return NextResponse.json({
        success: true,
        message: "আবেদনটি বাতিল/প্রত্যাখ্যান করা হয়েছে।",
        request: updated,
      });
    }

    if (action === "UNDER_REVIEW") {
      const updated = await prisma.documentRequest.update({
        where: { id },
        data: {
          status: "UNDER_REVIEW",
          reviewedByUserId: user.userId,
          reviewedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "আবেদন পর্যালোচনায় নেওয়া হয়েছে।",
        request: updated,
      });
    }

    if (action === "APPROVE") {
      let createdInvoiceId: string | null = null;

      // Check if document template requires fee
      const template = await prisma.documentTemplate.findFirst({
        where: { documentType: request.documentType, isActive: true },
      });

      if ((template?.requiresFee || requiresFeeInvoice) && template?.feeAmount && template.feeAmount > 0) {
        // Create fee invoice via Phase 6 Fee Rule Engine
        const invoiceNumber = await generateNextInvoiceNumber();
        const activeSession = await prisma.academicSession.findFirst({ where: { isCurrent: true } });

        const invoice = await prisma.feeInvoice.create({
          data: {
            invoiceNumber,
            studentId: request.studentId,
            sessionId: activeSession ? activeSession.id : request.sessionId || "",
            feeType: "DOCUMENT",
            title: `প্রত্যয়ন ফি (${template.titleBn}) - ${request.requestNumber}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            totalAmount: template.feeAmount,
            discountAmount: 0,
            waiverAmount: 0,
            netAmount: template.feeAmount,
            dueAmount: template.feeAmount,
            status: "UNPAID",
          },
        });
        createdInvoiceId = invoice.id;
      }

      const updated = await prisma.documentRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedByUserId: user.userId,
          reviewedAt: new Date(),
          feeInvoiceId: createdInvoiceId,
        },
      });

      await recordAuditLog({
        userId: user.userId,
        action: "APPROVE_DOCUMENT_REQUEST",
        entityType: "DocumentRequest",
        entityId: id,
        details: {
          requestNumber: request.requestNumber,
          feeInvoiceId: createdInvoiceId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "আবেদন সফলভাবে অনুমোদন করা হয়েছে।",
        request: updated,
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Document Request Review error:", error);
    return NextResponse.json({ error: "পর্যালোচনা প্রক্রিয়া সম্পন্ন করা যায়নি।" }, { status: 500 });
  }
}
