import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/verify/receipt/[token]
 * Public, privacy-safe verification of payment receipts.
 * Strictly excludes private information (guardian phone, NID, address, internal notes).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: "যাচাই টোকেন প্রদান করুন।" }, { status: 400 });
    }

    const receipt = await prisma.paymentReceipt.findFirst({
      where: {
        OR: [{ qrCodeToken: token }, { receiptNumber: token }],
      },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            fullNameEn: true,
            enrollments: {
              where: { status: "ACTIVE" },
              select: {
                jamatClass: { select: { nameBn: true } },
                section: { select: { nameBn: true } },
                rollNumber: true,
              },
              take: 1,
            },
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            title: true,
            feeType: true,
          },
        },
        refunds: {
          select: {
            amount: true,
            refundDate: true,
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: "রসিদটি সঠিক নয় বা খুঁজে পাওয়া যায়নি।",
        },
        { status: 404 }
      );
    }

    const totalRefunded = receipt.refunds.reduce((sum, r) => sum + r.amount, 0);
    const activeAmount = Math.max(0, receipt.amount - totalRefunded);

    return NextResponse.json({
      success: true,
      verified: true,
      institution: {
        nameBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
        nameEn: "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
        established: 2021,
      },
      receipt: {
        receiptNumber: receipt.receiptNumber,
        paymentStatus: receipt.paymentStatus,
        receiptDate: receipt.receiptDate,
        paymentMethod: receipt.paymentMethod,
        transactionId: receipt.transactionId ? `${receipt.transactionId.substring(0, 4)}***` : null,
        paidAmount: receipt.amount,
        refundedAmount: totalRefunded,
        netActiveAmount: activeAmount,
        invoiceNumber: receipt.invoice.invoiceNumber,
        invoiceTitle: receipt.invoice.title,
        studentName: receipt.student.fullNameBn,
        studentIdNumber: receipt.student.studentIdNumber,
        className: receipt.student.enrollments[0]?.jamatClass?.nameBn || "N/A",
        sectionName: receipt.student.enrollments[0]?.section?.nameBn || null,
        rollNumber: receipt.student.enrollments[0]?.rollNumber || null,
      },
    });
  } catch (error: any) {
    console.error("Receipt verify error:", error);
    return NextResponse.json({ error: "রসিদ যাচাই ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
