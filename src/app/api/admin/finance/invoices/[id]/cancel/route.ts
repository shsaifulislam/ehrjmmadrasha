import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/finance/invoices/[id]/cancel
 * Cancel an invoice with mandatory audit reason (verifies no paid amount)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { reason } = await req.json();
    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "ইনভয়েস বাতিলের যথাযথ কারণ উল্লেখ করা আবশ্যক (কমপক্ষে ৫ অক্ষর)।" },
        { status: 400 }
      );
    }

    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: params.id },
      include: { receipts: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "ইনভয়েসটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (invoice.paidAmount > 0 || invoice.receipts.length > 0) {
      return NextResponse.json(
        { error: "এই ইনভয়েসের বিপরীতে ইতিমধ্যে পেমেন্ট গৃহীত হয়েছে। বাতিল করার পূর্বে রিফান্ড সম্পন্ন করুন।" },
        { status: 400 }
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json({ error: "ইনভয়েসটি ইতিমধ্যে বাতিল করা হয়েছে।" }, { status: 400 });
    }

    const updated = await prisma.feeInvoice.update({
      where: { id: params.id },
      data: {
        status: "CANCELLED",
        dueAmount: 0,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "CANCEL_FEE_INVOICE",
      entityType: "FeeInvoice",
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        reason,
        previousStatus: invoice.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `ইনভয়েস ${invoice.invoiceNumber} সফলভাবে বাতিল করা হয়েছে।`,
      invoice: updated,
    });
  } catch (error: any) {
    console.error("Invoice cancel error:", error);
    return NextResponse.json({ error: "ইনভয়েস বাতিল করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
