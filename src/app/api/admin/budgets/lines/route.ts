import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getBudgetById,
  addOrUpdateBudgetLine,
  validateFundAllocationRule,
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

    return NextResponse.json({
      success: true,
      total: budget.lines.length,
      lines: budget.lines,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch budget lines" },
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
    const { budgetId, lineData } = body;

    if (!budgetId || !lineData || !lineData.categoryNameBn || !lineData.plannedAmount) {
      return NextResponse.json(
        { success: false, error: "বাজেট আইডি, খাতের নাম এবং বরাদ্দের পরিমাণ আবশ্যক।" },
        { status: 400 }
      );
    }

    // Fund restriction verification (e.g. Zakat rules)
    const fundCheck = validateFundAllocationRule(
      lineData.fundCode,
      lineData.categoryCode || "GENERAL",
      lineData.categoryType || "EXPENSE"
    );

    if (!fundCheck.isValid) {
      return NextResponse.json(
        { success: false, error: fundCheck.ruleNoticeBn },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const result = addOrUpdateBudgetLine(budgetId, lineData, actor);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "বাজেট লাইন সফলভাবে সংরক্ষিত হয়েছে।",
      line: result.line,
      budget: result.budget,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save budget line" },
      { status: 500 }
    );
  }
}
