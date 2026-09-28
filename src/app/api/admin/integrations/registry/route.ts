import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  loadIntegrationRegistry,
  updateIntegrationStatus,
  getIntegration,
  saveIntegrationRegistry,
} from "@/lib/integration";
import { recordAuditLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const items = loadIntegrationRegistry();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load registry" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "কেবলমাত্র অ্যাডমিন ইন্টিগ্রেশন পরিবর্তন করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, status, configuration, reason } = body;

    if (!id) {
      return NextResponse.json({ error: "ইন্টিগ্রেশন আইডি আবশ্যক।" }, { status: 400 });
    }

    let updatedItem: any = null;

    if (status) {
      updatedItem = await updateIntegrationStatus(id, status, user.userId, reason);
    }

    if (configuration) {
      const items = loadIntegrationRegistry();
      const index = items.findIndex((i: any) => i.id === id);
      if (index === -1) {
        return NextResponse.json({ error: "ইন্টিগ্রেশন পাওয়া যায়নি।" }, { status: 404 });
      }

      items[index].configuration = {
        ...items[index].configuration,
        ...configuration,
      };
      items[index].updatedBy = user.userId;
      items[index].updatedAt = new Date().toISOString();
      saveIntegrationRegistry(items);
      updatedItem = items[index];

      await recordAuditLog({
        userId: user.userId,
        action: "UPDATE_INTEGRATION_CONFIG",
        entityType: "IntegrationRegistry",
        entityId: id,
        details: {
          integrationCode: items[index].integrationCode,
          updatedFields: Object.keys(configuration),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "ইন্টিগ্রেশন সফলভাবে হালনাগাদ করা হয়েছে।",
      data: updatedItem,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update integration" }, { status: 500 });
  }
}
