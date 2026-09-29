import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getBudgetById, saveBudget, recordBudgetAudit } from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const budget = getBudgetById(id);
    if (!budget) {
      return NextResponse.json(
        { success: false, error: "Budget not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      budget,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only Admin can modify budget configuration." },
        { status: 403 }
      );
    }

    const budget = getBudgetById(id);
    if (!budget) {
      return NextResponse.json(
        { success: false, error: "Budget not found" },
        { status: 404 }
      );
    }

    const updates = await req.json();

    // Prevent direct status or id corruption via generic PATCH
    const updated = {
      ...budget,
      titleBn: updates.titleBn || budget.titleBn,
      titleEn: updates.titleEn || budget.titleEn,
      notes: updates.notes !== undefined ? updates.notes : budget.notes,
      warningThresholdRate: updates.warningThresholdRate ?? budget.warningThresholdRate,
      criticalThresholdRate: updates.criticalThresholdRate ?? budget.criticalThresholdRate,
      hardEnforcementEnabled: updates.hardEnforcementEnabled ?? budget.hardEnforcementEnabled,
      updatedBy: user.username || "Admin",
      updatedAt: new Date().toISOString(),
    };

    saveBudget(updated);

    recordBudgetAudit({
      budgetId: budget.id,
      action: "UPDATE_BUDGET",
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
      notes: "বাজেট কনফিগারেশন ও থ্রেশহোল্ড আপডেট করা হয়েছে।",
      details: { updatedKeys: Object.keys(updates) },
    });

    return NextResponse.json({
      success: true,
      message: "বাজেট কনফিগারেশন সংরক্ষিত হয়েছে।",
      budget: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update budget" },
      { status: 500 }
    );
  }
}
