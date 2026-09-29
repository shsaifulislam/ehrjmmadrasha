import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { transitionBudgetStatus, BudgetLifecycleStatus } from "@/lib/budget";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only Admin can change budget lifecycle state." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetStatus, reason } = body as {
      targetStatus: BudgetLifecycleStatus;
      reason?: string;
    };

    if (!targetStatus) {
      return NextResponse.json(
        { success: false, error: "targetStatus is required." },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const result = transitionBudgetStatus(id, targetStatus, actor, reason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `বাজেট সফলভাবে ${targetStatus} স্ট্যাটাসে স্থানান্তরিত হয়েছে।`,
      budget: result.budget,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute budget action" },
      { status: 500 }
    );
  }
}
