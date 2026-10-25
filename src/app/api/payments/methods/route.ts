import { NextResponse } from "next/server";
import { getPublicPaymentMethods } from "@/lib/systemSettings";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/methods
 * Public endpoint returning active payment channels for checkout and donations.
 */
export async function GET() {
  try {
    const methods = getPublicPaymentMethods();
    return NextResponse.json({ success: true, methods, paymentMethods: methods });
  } catch (error: any) {
    console.error("GET /api/payments/methods error:", error);
    return NextResponse.json(
      { error: "পেমেন্ট মাধ্যম লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
