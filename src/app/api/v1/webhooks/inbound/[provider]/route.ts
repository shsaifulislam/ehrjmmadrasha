import { NextRequest, NextResponse } from "next/server";
import { processInboundWebhook } from "@/lib/integration/webhookEngine";
import { verifyAndFinalizePayment } from "@/lib/integration/paymentAdapter";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/webhooks/inbound/[provider]
 * Generic Inbound Webhook Receiver with HMAC signature verification, replay protection, and domain routing
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider.toLowerCase();
    const signature =
      req.headers.get("x-ehrj-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-bkash-signature") ||
      undefined;

    const timestampHeader =
      req.headers.get("x-ehrj-timestamp") ||
      req.headers.get("x-timestamp") ||
      undefined;

    const correlationId = req.headers.get("x-correlation-id") || undefined;
    const body = await req.json();

    const eventType = body.eventType || (body.paymentId ? "PAYMENT_COMPLETED" : "GENERAL_EVENT");
    const integrationCode =
      provider === "bkash"
        ? "BKASH_PGW"
        : provider === "nagad"
        ? "NAGAD_PGW"
        : provider === "bank"
        ? "EXTERNAL_BANK_RECON"
        : "CUSTOM_API";

    // 1. Ingest into Webhook Engine (HMAC verification, replay check, idempotency check)
    const signingSecret =
      process.env.WEBHOOK_SIGNING_SECRET || "ehrj_demo_webhook_secret_2026";

    const webhookResult = await processInboundWebhook({
      integrationCode,
      provider: provider.toUpperCase(),
      eventType,
      rawPayload: body,
      signature,
      signingSecret: signature ? signingSecret : undefined,
      timestampHeader,
      idempotencyKey: body.idempotencyKey || body.transactionId || body.paymentId,
      correlationId,
    });

    if (!webhookResult.success && webhookResult.error) {
      return NextResponse.json(
        {
          error: webhookResult.error,
          webhookId: webhookResult.webhookRecord.webhookId,
          status: webhookResult.webhookRecord.processingStatus,
        },
        { status: 400 }
      );
    }

    if (webhookResult.isDuplicate) {
      return NextResponse.json({
        success: true,
        message: "ইতিপূর্বেই প্রক্রিয়াজাতকৃত ইভেন্ট (Idempotent replay).",
        webhookId: webhookResult.webhookRecord.webhookId,
        status: webhookResult.webhookRecord.processingStatus,
      });
    }

    // 2. Domain Handlers (e.g. Payment Gateway verification)
    let domainResult: any = null;
    if (
      (provider === "bkash" || provider === "nagad") &&
      eventType === "PAYMENT_COMPLETED" &&
      body.invoiceId &&
      body.amount &&
      (body.transactionId || body.paymentId)
    ) {
      domainResult = await verifyAndFinalizePayment({
        provider: provider === "bkash" ? "BKASH" : "NAGAD",
        providerTransactionId: body.transactionId || body.paymentId,
        invoiceId: body.invoiceId,
        amount: Number(body.amount),
        idempotencyKey: body.idempotencyKey,
      });
    }

    return NextResponse.json({
      success: true,
      message: "ওয়েবহুক সফলভাবে গৃহীত ও প্রক্রিয়াজাত হয়েছে।",
      webhookId: webhookResult.webhookRecord.webhookId,
      processingStatus: webhookResult.webhookRecord.processingStatus,
      domainResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "ওয়েবহুক প্রসেসিং ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
