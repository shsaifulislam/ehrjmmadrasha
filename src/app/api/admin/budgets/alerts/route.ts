import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllAlerts,
  acknowledgeAlert,
  scanAndGenerateBudgetAlerts,
} from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const budgetId = searchParams.get("budgetId");
    const level = searchParams.get("level");

    let alerts = getAllAlerts();
    if (budgetId) {
      alerts = alerts.filter((a) => a.budgetId === budgetId);
    }
    if (level) {
      alerts = alerts.filter((a) => a.alertLevel === level);
    }

    return NextResponse.json({
      success: true,
      total: alerts.length,
      alerts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    // Action 1: Acknowledge an existing alert
    if (body.alertId) {
      const result = acknowledgeAlert(body.alertId, actor);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "সতর্কবার্তা গৃহীত হিসেবে চিহ্নিত হয়েছে।",
        alert: result.alert,
      });
    }

    // Action 2: Trigger fresh threshold scan on budget
    if (body.budgetId) {
      const generated = scanAndGenerateBudgetAlerts(body.budgetId);
      return NextResponse.json({
        success: true,
        message: `বাজেট স্ক্যান সম্পন্ন হয়েছে। নতুন সতর্কবার্তা: ${generated.length} টি।`,
        newAlerts: generated,
      });
    }

    return NextResponse.json(
      { success: false, error: "alertId or budgetId is required." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process alert action" },
      { status: 500 }
    );
  }
}
