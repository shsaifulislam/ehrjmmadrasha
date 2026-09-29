import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  generateVarianceReport,
  getFundBudgetSummaries,
  getBudgetById,
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

    if (!budgetId) {
      return NextResponse.json(
        { success: false, error: "budgetId is required" },
        { status: 400 }
      );
    }

    const budget = getBudgetById(budgetId);
    if (!budget) {
      return NextResponse.json(
        { success: false, error: "Budget not found" },
        { status: 404 }
      );
    }

    const varianceReport = generateVarianceReport(budgetId);
    const fundSummaries = getFundBudgetSummaries(budgetId);

    return NextResponse.json({
      success: true,
      budgetCode: budget.budgetCode,
      titleBn: budget.titleBn,
      totalLines: varianceReport.length,
      varianceReport,
      fundSummaries,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate variance report" },
      { status: 500 }
    );
  }
}
