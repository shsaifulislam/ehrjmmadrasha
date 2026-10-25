import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PaymentIntentService } from "@/lib/payment/PaymentIntentService";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/finance/gateway/initiate
 * Initiates an official bKash or Nagad online payment session.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করা আবশ্যক।" }, { status: 401 });
    }

    if (user.role !== "GUARDIAN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অভিভাবকগণ অনলাইন গেটওয়ে চেকআউট করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { invoiceId, amount, provider = "BKASH", payerPhone, idempotencyKey } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "ইনভয়েস আইডি প্রদান আবশ্যক।" }, { status: 400 });
    }

    const prov = provider.toUpperCase();
    if (prov !== "BKASH" && prov !== "NAGAD") {
      return NextResponse.json({ error: "সমর্থিত মাধ্যম: BKASH বা NAGAD" }, { status: 400 });
    }

    const intent = await PaymentIntentService.createIntent({
      guardianUserId: user.userId,
      guardianEmail: user.email,
      invoiceId,
      amount: amount ? Number(amount) : undefined,
      provider: prov,
      payerPhone,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      message: `${prov} চেকআউট সেশন প্রস্তুত হয়েছে।`,
      checkoutUrl: intent.checkoutUrl,
      intentNumber: intent.intentNumber,
      amount: intent.amount,
      currency: intent.currency,
      invoiceNumber: intent.invoiceNumber,
      expiresAt: intent.expiresAt,
    });
  } catch (error: any) {
    console.error("Gateway initiate error:", error);
    return NextResponse.json(
      { error: error.message || "পেমেন্ট গেটওয়ে সেশন শুরু করতে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
