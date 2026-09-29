import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  detectPolicyConflicts,
  resolvePolicyConflict,
  getAllConflicts,
} from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const conflicts = detectPolicyConflicts();

    return NextResponse.json({
      success: true,
      totalCount: conflicts.length,
      openCount: conflicts.filter((c) => c.status === "OPEN").length,
      conflicts,
    });
  } catch (err: any) {
    console.error("GET /api/governance/conflicts error:", err);
    return NextResponse.json({ error: err.message || "Failed to scan conflicts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { conflictId, resolution = "RESOLVED", notes } = body;

    if (!conflictId) {
      return NextResponse.json({ error: "conflictId প্রদান করা আবশ্যক।" }, { status: 400 });
    }

    const res = resolvePolicyConflict(
      conflictId,
      resolution,
      { id: user.userId, name: user.name || "Admin", role: user.role },
      notes
    );

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      conflict: res.conflict,
    });
  } catch (err: any) {
    console.error("POST /api/governance/conflicts error:", err);
    return NextResponse.json({ error: err.message || "Failed to resolve conflict" }, { status: 500 });
  }
}
