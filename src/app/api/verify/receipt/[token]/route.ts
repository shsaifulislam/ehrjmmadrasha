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
  { params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const params = await paramsPromise;
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
      // Check donation ledger records
      const { getDonationByTokenOrReceipt } = await import("@/lib/donations");
      const donation = getDonationByTokenOrReceipt(token);

      if (donation) {
        const isCompleted = donation.status === "COMPLETED";
        return NextResponse.json({
          success: true,
          verified: isCompleted,
          isPendingVerification: donation.status === "PENDING_VERIFICATION",
          isDonation: true,
          verificationNote: isCompleted
            ? "এই অনুদান/সাদাকাহ রসিদটি মাদরাসার প্রাতিষ্ঠানিক তহবিল রেজিস্টারে সম্পূর্ণ যাচাইকৃত ও গৃহীত।"
            : "সতর্কতা: এই অনুদানটি এখনও মাদরাসার হিসাব বিভাগ কর্তৃক চূড়ান্ত যাচাই ও অনুমোদিত হয়নি (PENDING)।",
          institution: {
            nameBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
            nameEn: "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
            established: 2021,
          },
          student: {
            fullNameBn: donation.donorName,
            fullNameEn: donation.isAnonymous ? "Anonymous Donor" : "Valued Donor / Patron",
            studentIdNumber: donation.isAnonymous ? "গোপন অনুদানকারী" : donation.donorPhone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
            className: "অনুদান ও ওয়াকফ তহবিল",
            sectionName: donation.fundCategoryBn,
            rollNumber: null,
          },
          receipt: {
            receiptNumber: donation.receiptNumber,
            paymentStatus: isCompleted ? "SUCCESSFUL" : "PENDING_VERIFICATION",
            receiptDate: donation.createdAt,
            paymentMethod: donation.paymentMethodBn || donation.paymentMethod,
            transactionId: donation.transactionId ? `${donation.transactionId.substring(0, 4)}***` : null,
            paidAmount: donation.amount,
            refundedAmount: 0,
            netActiveAmount: donation.amount,
            invoiceNumber: donation.id,
            feeType: "অনুদান / সাদাকাহ তহবিল",
            invoiceTitle: donation.fundCategoryBn,
          },
        });
      }

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
    const isFullyVerified =
      receipt.paymentStatus === "SUCCESSFUL" ||
      receipt.paymentStatus === "PARTIALLY_REFUNDED";

    return NextResponse.json({
      success: true,
      verified: isFullyVerified,
      isPendingVerification: receipt.paymentStatus === "PENDING_VERIFICATION",
      verificationNote:
        receipt.paymentStatus === "PARTIALLY_REFUNDED"
          ? `রসিদটি মাদরাসার ডাটাবেজে যাচাইকৃত ও গৃহীত (আংশিক রিফান্ডকৃত: ৳${totalRefunded}, কার্যকরী অর্থ: ৳${activeAmount})।`
          : isFullyVerified
          ? "রসিদটি মাদরাসার অফিসিয়াল ডাটাবেজে সম্পূর্ণ যাচাইকৃত ও গৃহীত।"
          : receipt.paymentStatus === "PENDING_VERIFICATION"
          ? "সতর্কতা: এই পেমেন্ট দাবিটি এখনও মাদরাসার হিসাব বিভাগ কর্তৃক চূড়ান্ত যাচাই ও অনুমোদিত হয়নি (PENDING_VERIFICATION)। এটি কোনো চূড়ান্ত অর্থ পরিশোধের প্রমাণ নয়।"
          : `এই পেমেন্টটির বর্তমান স্ট্যাটাস: ${receipt.paymentStatus}`,
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
