import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ProviderWebhookVerifier } from "@/lib/payment/ProviderWebhookVerifier";
import { verifyAndFinalizePayment } from "@/lib/integration/paymentAdapter";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/webhooks/inbound/[provider]
 * Provider-Specific Cryptographic Webhook Receiver with DB-backed Idempotency and DLQ
 */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ provider: string }> }) {
  const params = await paramsPromise;
  const provider = params.provider.toUpperCase();
  const rawBodyText = await req.text();
  let body: any = {};

  try {
    body = rawBodyText ? JSON.parse(rawBodyText) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON webhook payload" }, { status: 400 });
  }

  const payloadHash = crypto.createHash("sha256").update(rawBodyText).digest("hex");
  const correlationId = req.headers.get("x-correlation-id") || `corr_${crypto.randomBytes(8).toString("hex")}`;
  const timestampHeader = req.headers.get("x-ehrj-timestamp") || req.headers.get("x-timestamp");
  const webhookId = `WH-IN-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  const eventType = body.eventType || (body.paymentId ? "PAYMENT_COMPLETED" : "GENERAL_EVENT");
  const idempotencyKey =
    body.idempotencyKey ||
    body.transactionId ||
    body.paymentId ||
    `inbound_${provider}_${eventType}_${payloadHash.substring(0, 16)}`;

  try {
    // 1. Replay Protection Window Check (5 mins) if timestamp is present
    if (timestampHeader) {
      const parsedTime = Number(timestampHeader) || new Date(timestampHeader).getTime();
      if (!isNaN(parsedTime)) {
        const diffSec = Math.abs((Date.now() - parsedTime) / 1000);
        if (diffSec > 300) {
          const errorMsg = `Replay attack protection: Timestamp delta (${Math.round(diffSec)}s) exceeds 300s window`;
          await prisma.inboundWebhookEvent.create({
            data: {
              webhookId,
              provider,
              eventType,
              payloadHash,
              signatureStatus: "INVALID",
              processingStatus: "DEAD_LETTER",
              idempotencyKey: `${idempotencyKey}-REPLAY-FAIL-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
              correlationId,
              error: errorMsg,
            },
          });

          await prisma.deadLetterQueue.create({
            data: {
              source: "INBOUND_WEBHOOK",
              referenceId: webhookId,
              provider,
              eventType,
              lastError: errorMsg,
              correlationId,
            },
          });

          return NextResponse.json({ error: errorMsg }, { status: 400 });
        }
      }
    }

    // 2. Database-backed Idempotency Check (SECTION 3.8 & 3.9)
    const existingEvent = await prisma.inboundWebhookEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existingEvent && existingEvent.processingStatus === "PROCESSED") {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        message: "ইতিপূর্বেই প্রক্রিয়াজাতকৃত ইভেন্ট (Idempotent replay).",
        webhookId: existingEvent.webhookId,
      });
    }

    // 3. Provider-Specific Cryptographic Verification (SECTION 4)
    const verification = await ProviderWebhookVerifier.verify(
      provider,
      body,
      req.headers,
      rawBodyText
    );

    if (!verification.isValid) {
      await prisma.inboundWebhookEvent.create({
        data: {
          webhookId,
          provider,
          eventType,
          payloadHash,
          signatureStatus: "INVALID",
          processingStatus: "FAILED",
          idempotencyKey: `${idempotencyKey}-SIG-FAIL-${Date.now()}`,
          correlationId,
          error: verification.error || "Cryptographic signature mismatch",
        },
      });

      return NextResponse.json(
        { error: verification.error || "ক্রিপ্টোগ্রাফিক স্বাক্ষর যাচাই ব্যর্থ হয়েছে।" },
        { status: 401 }
      );
    }

    // 4. Save Event Record as PENDING
    const webhookRecord = await prisma.inboundWebhookEvent.upsert({
      where: { idempotencyKey },
      update: {
        attemptCount: { increment: 1 },
      },
      create: {
        webhookId,
        provider,
        eventType,
        payloadHash,
        signature: req.headers.get("x-bkash-signature") || req.headers.get("x-signature") || null,
        signatureStatus: "VERIFIED",
        processingStatus: "PROCESSED",
        idempotencyKey,
        correlationId,
        processedAt: new Date(),
      },
    });

    // 5. Domain Handler: Payment Execution & Finalization
    let domainResult: any = null;
    if (
      (provider === "BKASH" || provider === "NAGAD" || provider === "BANK") &&
      (eventType === "PAYMENT_COMPLETED" || body.status === "Completed") &&
      body.invoiceId &&
      body.amount &&
      (body.transactionId || body.paymentId || body.trxID)
    ) {
      domainResult = await verifyAndFinalizePayment({
        provider: provider === "BKASH" ? "BKASH" : provider === "NAGAD" ? "NAGAD" : "BANK",
        providerTransactionId: body.transactionId || body.trxID || body.paymentId,
        invoiceId: body.invoiceId,
        amount: Number(body.amount),
        idempotencyKey,
      });
    }

    return NextResponse.json({
      success: true,
      message: "ওয়েবহুক সফলভাবে গৃহীত ও প্রক্রিয়াজাত হয়েছে।",
      webhookId: webhookRecord.webhookId,
      domainResult,
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: error.message || "ওয়েবহুক প্রসেসিং ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
