import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { syncPoliciesToPhase22RAG, recordAuditLog } from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const res = syncPoliciesToPhase22RAG();

    recordAuditLog({
      documentId: "SYSTEM-RAG-SYNC",
      documentCode: "SYSTEM-SYNC",
      version: "ALL",
      action: "SYNC_TO_RAG",
      actorId: user.userId,
      actorName: user.name || "Admin",
      actorRole: user.role,
      notes: `Synced ${res.syncedCount} policies to Phase 22 RAG`,
      details: res,
    });

    return NextResponse.json({
      success: true,
      message: res.message,
      data: res,
    });
  } catch (err: any) {
    console.error("POST /api/governance/sync-rag error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync to Phase 22" }, { status: 500 });
  }
}
