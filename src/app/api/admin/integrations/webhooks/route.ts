import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";
import {
  loadWebhookSubscriptions,
  saveWebhookSubscriptions,
  loadWebhookDeliveries,
  loadInboundWebhooks,
  WebhookSubscription,
} from "@/lib/integration";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const subscriptions = loadWebhookSubscriptions();
    const deliveries = loadWebhookDeliveries(50);
    const inbound = loadInboundWebhooks().slice(-50).reverse();

    return NextResponse.json({
      success: true,
      data: {
        subscriptions,
        deliveries,
        inbound,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load webhook data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন ওয়েবহুক সাবস্ক্রিপশন পরিচালনা করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, integrationCode, targetUrl, eventTypes, secret } = body;

    if (!name || !targetUrl || !eventTypes || !Array.isArray(eventTypes) || eventTypes.length === 0) {
      return NextResponse.json(
        { error: "নাম, টার্গেট URL এবং কমপক্ষে একটি ইভেন্ট টাইপ আবশ্যক।" },
        { status: 400 }
      );
    }

    const subscriptions = loadWebhookSubscriptions();
    const rawSecret = secret || `whsec_${crypto.randomBytes(18).toString("hex")}`;
    const secretHash = crypto.createHash("sha256").update(rawSecret).digest("hex");
    const secretMasked = `${rawSecret.substring(0, 8)}...****************`;

    const subId = `SUB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const newSub: WebhookSubscription = {
      id: subId,
      name,
      integrationCode: integrationCode || "EHRJ_WEBHOOKS",
      targetUrl,
      eventTypes,
      secretMasked,
      secretHash,
      status: "ACTIVE",
      retryPolicy: {
        maxAttempts: 3,
        initialBackoffSec: 2,
        backoffMultiplier: 2,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subscriptions.unshift(newSub);
    saveWebhookSubscriptions(subscriptions);

    await recordAuditLog({
      userId: user.userId,
      action: "CREATE_WEBHOOK_SUBSCRIPTION",
      entityType: "WebhookSubscription",
      entityId: subId,
      details: {
        name,
        targetUrl,
        eventTypes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ওয়েবহুক সাবস্ক্রিপশন সফলভাবে যোগ করা হয়েছে।",
      data: {
        subscription: newSub,
        signingSecret: rawSecret, // Display once
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create webhook subscription" }, { status: 500 });
  }
}
