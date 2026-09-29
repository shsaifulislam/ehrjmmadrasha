import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllAcknowledgements,
  getPendingAcknowledgementsForUser,
} from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    if (mode === "my-pending") {
      const userRes = getPendingAcknowledgementsForUser(user.userId, user.role as any);
      return NextResponse.json({
        success: true,
        pending: userRes.pendingDocuments,
        completed: userRes.completedDocuments,
      });
    }

    if (user.role !== "ADMIN" && user.role !== "PRINCIPAL") {
      const userRes = getPendingAcknowledgementsForUser(user.userId, user.role as any);
      return NextResponse.json({
        success: true,
        pending: userRes.pendingDocuments,
        completed: userRes.completedDocuments,
      });
    }

    const allAcks = getAllAcknowledgements();
    return NextResponse.json({
      success: true,
      totalCount: allAcks.length,
      acknowledgements: allAcks,
    });
  } catch (err: any) {
    console.error("GET /api/governance/acknowledgements error:", err);
    return NextResponse.json({ error: err.message || "Failed to load acknowledgements" }, { status: 500 });
  }
}
