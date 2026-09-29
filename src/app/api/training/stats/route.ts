import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getTrainingDashboardStats } from "@/lib/training";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const stats = getTrainingDashboardStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate training stats" },
      { status: 500 }
    );
  }
}
