import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { PaymentExecutionService } from "@/lib/payment/PaymentExecutionService";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/finance/gateway/execute
 * Direct server-to-server finalization of payment gateway transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "লগইন করা আবশ্যক।" }, { status: 401 });
    }

    const body = await req.json();
    const { gatewayPaymentId, provider = "BKASH" } = body;

    if (!gatewayPaymentId) {
      return NextResponse.json({ error: "গেটওয়ে পেমেন্ট আইডি আবশ্যক।" }, { status: 400 });
    }

    const prov = provider.toUpperCase() === "NAGAD" ? "NAGAD" : "BKASH";

    const result = await PaymentExecutionService.executeGatewayPayment({
      gatewayPaymentId,
      provider: prov,
      actorUserId: user.userId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Gateway execute error:", error);
    return NextResponse.json(
      { error: error.message || "পেমেন্ট চূড়ান্তকরণ ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
