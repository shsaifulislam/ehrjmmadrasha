import { NextRequest, NextResponse } from "next/server";
import { PaymentExecutionService } from "@/lib/payment/PaymentExecutionService";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/finance/gateway/callback
 * Handles browser return from official bKash or Nagad payment checkout screen.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentID = searchParams.get("paymentID") || searchParams.get("payment_ref_id");
  const status = searchParams.get("status")?.toLowerCase();
  const providerParam = (searchParams.get("provider") || "BKASH").toUpperCase();
  const provider = providerParam === "NAGAD" ? "NAGAD" : "BKASH";

  if (status === "cancel") {
    return NextResponse.redirect(new URL("/portal?payment=cancelled", req.url));
  }

  if (status === "failure" || !paymentID) {
    return NextResponse.redirect(new URL("/portal?payment=failed", req.url));
  }

  try {
    const result = await PaymentExecutionService.executeGatewayPayment({
      gatewayPaymentId: paymentID,
      provider,
    });

    const receiptNo = result.receipt?.receiptNumber || "COMPLETED";
    return NextResponse.redirect(
      new URL(`/portal?payment=success&receipt=${receiptNo}`, req.url)
    );
  } catch (err: any) {
    console.error("Gateway callback error:", err);
    const errText = encodeURIComponent(err.message || "পেমেন্ট সম্পন্ন হয়নি");
    return NextResponse.redirect(
      new URL(`/portal?payment=error&message=${errText}`, req.url)
    );
  }
}
