import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getDocumentById,
  transitionDocumentStatus,
  toggleLegalHold,
  submitDocumentForReview,
  DocumentStatus,
} from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const doc = getDocumentById(id);
    if (!doc) {
      return NextResponse.json({ error: "ডকুমেন্ট পাওয়া যায়নি।" }, { status: 404 });
    }

    const body = await req.json();
    const { action, notes, isHoldActive, reason, authority } = body;

    const actor = {
      id: user.userId,
      name: user.name || "System User",
      role: user.role as any,
    };

    if (action === "SUBMIT_FOR_REVIEW") {
      const res = submitDocumentForReview({
        documentIdOrCode: doc.id,
        submitter: actor,
        notes,
      });
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message, document: res.document });
    }

    if (action === "TOGGLE_HOLD") {
      if (user.role !== "ADMIN" && user.role !== "PRINCIPAL") {
        return NextResponse.json({ error: "শুধুমাত্র এডমিন বা প্রিন্সিপাল লিগ্যাল হোল্ড পরিবর্তন করতে পারেন।" }, { status: 403 });
      }
      const res = toggleLegalHold(doc.id, {
        isHoldActive: Boolean(isHoldActive),
        reason,
        authority,
        actor: { id: user.userId, name: user.name || "Admin", role: user.role as any },
      });
      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: res.message, document: res.document });
    }

    // Status transitions
    const statusMap: Record<string, DocumentStatus> = {
      PUBLISH: "PUBLISHED",
      MARK_EFFECTIVE: "EFFECTIVE",
      SUPERSEDE: "SUPERSEDED",
      EXPIRE: "EXPIRED",
      ARCHIVE: "ARCHIVED",
      WITHDRAW: "WITHDRAWN",
    };

    const targetStatus = statusMap[action];
    if (!targetStatus) {
      return NextResponse.json({ error: `অজানা অ্যাকশন: ${action}` }, { status: 400 });
    }

    const res = transitionDocumentStatus(doc.id, targetStatus, actor, notes);
    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      document: res.document,
      previousStatus: res.previousStatus,
      newStatus: res.newStatus,
    });
  } catch (err: any) {
    console.error("POST /api/governance/documents/[id]/action error:", err);
    return NextResponse.json({ error: err.message || "Failed to process action" }, { status: 500 });
  }
}
