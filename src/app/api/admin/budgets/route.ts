import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAllBudgets, createBudget } from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const fiscalYear = searchParams.get("fiscalYear");
    const search = searchParams.get("search")?.toLowerCase().trim();

    let budgets = getAllBudgets();

    if (status) {
      budgets = budgets.filter((b) => b.status === status);
    }
    if (fiscalYear) {
      budgets = budgets.filter((b) => b.fiscalYear === fiscalYear);
    }
    if (search) {
      budgets = budgets.filter(
        (b) =>
          b.titleBn.toLowerCase().includes(search) ||
          b.titleEn.toLowerCase().includes(search) ||
          b.budgetCode.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      total: budgets.length,
      budgets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only Admin can create budgets." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.titleBn || !body.periodId || !body.fiscalYear || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { success: false, error: "শিরোনাম, বাজেট মেয়াদ, অর্থবছর এবং তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const newBudget = createBudget(
      {
        titleBn: body.titleBn,
        titleEn: body.titleEn || body.titleBn,
        periodId: body.periodId,
        periodNameBn: body.periodNameBn || body.periodId,
        fiscalYear: body.fiscalYear,
        startDate: body.startDate,
        endDate: body.endDate,
        notes: body.notes,
      },
      actor
    );

    return NextResponse.json(
      {
        success: true,
        message: "নতুন বাজেট খসড়া সফলভাবে সংরক্ষিত হয়েছে।",
        budget: newBudget,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create budget" },
      { status: 500 }
    );
  }
}
