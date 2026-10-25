/**
 * EHRJ DIGITAL CAMPUS & ERP — PAYMENT INFRASTRUCTURE
 * Payment Intent Service
 *
 * Enforces:
 * 1. Guardian ownership & student relationship validation.
 * 2. Authoritative invoice amount calculation from DB (client cannot tamper).
 * 3. Atomic creation of PaymentIntent record in PENDING state.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayFactory } from "./PaymentGatewayFactory";
import { getAppUrl } from "@/lib/env";

export interface InitiatePaymentParams {
  guardianUserId: string;
  guardianEmail: string;
  invoiceId: string;
  amount?: number;
  provider: "BKASH" | "NAGAD";
  idempotencyKey?: string;
  payerPhone?: string;
}

export class PaymentIntentService {
  public static async createIntent(params: InitiatePaymentParams) {
    // 1. Authorize Guardian relationship
    const guardian = await prisma.guardian.findFirst({
      where: {
        OR: [{ userId: params.guardianUserId }, { email: params.guardianEmail }],
      },
      include: { students: true },
    });

    if (!guardian || guardian.students.length === 0) {
      throw new Error("অননুমোদিত অ্যাক্সেস। কোনো সংযুক্ত শিক্ষার্থীর অভিভাবক অ্যাকাউন্ট পাওয়া যায়নি।");
    }

    const linkedStudentIds = guardian.students.map((s) => s.studentId);

    // 2. Fetch authoritative FeeInvoice
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: params.invoiceId },
      include: { student: true },
    });

    if (!invoice) {
      throw new Error("ইনভয়েস পাওয়া যায়নি।");
    }

    if (!linkedStudentIds.includes(invoice.studentId)) {
      throw new Error(`অননুমোদিত অ্যাক্সেস। ইনভয়েস ${invoice.invoiceNumber} আপনার সন্তানের নয়।`);
    }

    if (invoice.status === "PAID" || invoice.dueAmount <= 0) {
      throw new Error("এই ইনভয়েসটির সম্পূর্ণ অর্থ ইতিপূর্বেই পরিশোধিত।");
    }

    // 3. Determine authoritative payable amount
    // If client requested a partial amount, validate it strictly against dueAmount
    const requestedAmount = params.amount ? Math.round(Number(params.amount) * 100) / 100 : invoice.dueAmount;
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      throw new Error("পেমেন্টের পরিমাণ সঠিক নয়।");
    }

    if (requestedAmount > invoice.dueAmount) {
      throw new Error(`পেমেন্টের পরিমাণ (৳ ${requestedAmount}) বর্তমান বকেয়া (৳ ${invoice.dueAmount})-এর চেয়ে বেশি হতে পারে না।`);
    }

    const intentNumber = `PI-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const effectiveIdempotency =
      params.idempotencyKey ||
      crypto.createHash("sha256").update(`${params.invoiceId}-${requestedAmount}-${intentNumber}`).digest("hex");

    const appUrl = getAppUrl();
    const callbackUrl = `${appUrl}/api/portal/finance/gateway/callback?provider=${params.provider.toLowerCase()}`;

    // 4. Call Payment Gateway Provider
    const gateway = PaymentGatewayFactory.getProvider(params.provider);
    const gatewayResult = await gateway.createPayment({
      intentId: intentNumber,
      intentNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      studentName: invoice.student.fullNameBn,
      amount: requestedAmount,
      currency: "BDT",
      payerPhone: params.payerPhone || guardian.phone || undefined,
      callbackUrl,
    });

    if (!gatewayResult.success) {
      throw new Error(gatewayResult.error || "পেমেন্ট গেটওয়েতে সংযোগ করতে ব্যর্থ হয়েছে।");
    }

    // 5. Persist PaymentIntent in DB with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const intent = await prisma.paymentIntent.create({
      data: {
        intentNumber,
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        guardianUserId: params.guardianUserId,
        amount: requestedAmount,
        currency: "BDT",
        provider: params.provider,
        gatewayPaymentId: gatewayResult.gatewayPaymentId,
        status: "PENDING",
        idempotencyKey: effectiveIdempotency,
        checkoutUrl: gatewayResult.checkoutUrl,
        clientCallbackUrl: callbackUrl,
        expiresAt,
        rawGatewayResponse: JSON.stringify(gatewayResult.rawResponse || {}),
      },
    });

    return {
      intentId: intent.id,
      intentNumber: intent.intentNumber,
      gatewayPaymentId: intent.gatewayPaymentId,
      checkoutUrl: intent.checkoutUrl,
      amount: intent.amount,
      currency: intent.currency,
      expiresAt: intent.expiresAt,
      invoiceNumber: invoice.invoiceNumber,
    };
  }
}
