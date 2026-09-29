import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAllRevisions, requestBudgetRevision } from "@/lib/budget";

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
    const status = searchParams.get("status");

    let revisions = getAllRevisions();
    if (budgetId) {
      revisions = revisions.filter((r) => r.budgetId === budgetId);
    }
    if (status) {
      revisions = revisions.filter((r) => r.status === status);
    }

    return NextResponse.json({
      success: true,
      total: revisions.length,
      revisions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch revisions" },
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
    const { budgetId, requestData } = body;

    if (!budgetId || !requestData || !requestData.titleBn || !requestData.reasonBn || !requestData.lineDiffs) {
      return NextResponse.json(
        { success: false, error: "বাজেট আইডি, রিভিশন শিরোনাম, কারণ এবং লাইনের পরিবর্তন তালিকা আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const result = requestBudgetRevision(budgetId, requestData, actor);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "বাজেট রিভিশন প্রস্তাব সফলভাবে সাবমিট করা হয়েছে।",
      revision: result.revision,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create revision" },
      { status: 500 }
    );
  }
}
