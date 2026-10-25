import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getPaymentSettings,
  savePaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
  PaymentMethodConfig,
} from "@/lib/systemSettings";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/payments/methods
 * Admin endpoint to list all payment configurations
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const methods = getPaymentSettings();
    return NextResponse.json({ success: true, methods });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/payments/methods
 * Admin endpoint to add or edit a payment method
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { id, type, nameBn, accountNumber, accountType, bankName, branchName, accountHolderName, routingNumber, instructions, isEnabled, apiMode, apiKey, apiSecret, merchantId } = body;

    if (!type || !nameBn || !accountNumber) {
      return NextResponse.json(
        { error: "পদ্ধতির ধরন, নাম এবং অ্যাকাউন্ট/মার্চেন্ট নম্বর প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const methodConfig: PaymentMethodConfig = {
      id: id || `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      nameBn: String(nameBn).trim(),
      accountNumber: String(accountNumber).trim(),
      accountType: accountType || "MERCHANT",
      bankName: bankName ? String(bankName).trim() : undefined,
      branchName: branchName ? String(branchName).trim() : undefined,
      accountHolderName: accountHolderName ? String(accountHolderName).trim() : undefined,
      routingNumber: routingNumber ? String(routingNumber).trim() : undefined,
      instructions: instructions ? String(instructions).trim() : "",
      isEnabled: isEnabled !== false,
      apiMode: apiMode || "SANDBOX",
      apiKey: apiKey ? String(apiKey).trim() : undefined,
      apiSecret: apiSecret ? String(apiSecret).trim() : undefined,
      merchantId: merchantId ? String(merchantId).trim() : undefined,
      updatedAt: new Date().toISOString(),
    };

    const updated = savePaymentMethod(methodConfig);

    await recordAuditLog({
      userId: user.userId,
      action: "PAYMENT_METHOD_CONFIGURED",
      entityType: "PaymentMethod",
      entityId: methodConfig.id,
      details: {
        methodName: methodConfig.nameBn,
        type: methodConfig.type,
        accountNumber: methodConfig.accountNumber,
        isEnabled: methodConfig.isEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      message: "পেমেন্ট পদ্ধতি সফলভাবে সংরক্ষিত হয়েছে।",
      methods: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/payments/methods
 * Admin endpoint to remove a payment method
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "পদ্ধতির আইডি প্রয়োজন।" }, { status: 400 });
    }

    const updated = deletePaymentMethod(id);

    await recordAuditLog({
      userId: user.userId,
      action: "PAYMENT_METHOD_DELETED",
      entityType: "PaymentMethod",
      entityId: id,
    });

    return NextResponse.json({
      success: true,
      message: "পেমেন্ট পদ্ধতি অপসারণ করা হয়েছে।",
      methods: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/payments/methods
 * Toggle active state of a payment method
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { id, isEnabled } = body;
    if (!id || typeof isEnabled !== "boolean") {
      return NextResponse.json({ error: "অবৈধ তথ্য।" }, { status: 400 });
    }

    const updated = togglePaymentMethod(id, isEnabled);
    return NextResponse.json({ success: true, methods: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
