import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAllPeriods, savePeriod, recordBudgetAudit, BudgetPeriod } from "@/lib/budget";

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

    const periods = getAllPeriods();
    return NextResponse.json({
      success: true,
      total: periods.length,
      periods,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch budget periods" },
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
    if (!body.titleBn || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "শিরোনাম, শুরুর তারিখ ও শেষ তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const periodId = body.id || `EHRJ-BPR-${year}-${Math.floor(10 + Math.random() * 90)}`;

    const period: BudgetPeriod = {
      id: periodId,
      periodCode: body.periodCode || `FY-${year}-${year + 1}`,
      titleBn: body.titleBn,
      titleEn: body.titleEn || body.titleBn,
      periodType: body.periodType || "FINANCIAL_YEAR",
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status || "PLANNED",
      isLocked: false,
      notes: body.notes,
      createdBy: user.username || "Admin",
      createdAt: new Date().toISOString(),
      approvedBy: body.approvedBy,
    };

    savePeriod(period);

    recordBudgetAudit({
      budgetId: period.id,
      action: "CREATE_PERIOD",
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
      notes: `নতুন বাজেট মেয়াদ তৈরি: ${period.titleBn} (${period.startDate} হতে ${period.endDate})`,
      details: { periodId: period.id, type: period.periodType },
    });

    return NextResponse.json({
      success: true,
      message: "বাজেট মেয়াদ সফলভাবে তৈরি হয়েছে।",
      period,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create period" },
      { status: 500 }
    );
  }
}
