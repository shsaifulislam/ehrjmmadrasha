import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { processApprovalDecision } from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র এডমিন অথবা প্রিন্সিপাল মহোদয় অনুমোদন প্রদান করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { decision, notes, version } = body;

    if (!decision || !["APPROVED", "REVISION_REQUIRED", "REJECTED"].includes(decision)) {
      return NextResponse.json(
        { error: "বৈধ সিদ্ধান্ত ('APPROVED', 'REVISION_REQUIRED', 'REJECTED') প্রদান করুন।" },
        { status: 400 }
      );
    }

    if (!notes || !notes.trim()) {
      return NextResponse.json({ error: "অনুমোদন বা পর্যালোচনার মন্তব্য প্রদান আবশ্যক।" }, { status: 400 });
    }

    const res = processApprovalDecision({
      documentIdOrCode: id,
      version,
      decision,
      reviewer: {
        id: user.userId,
        name: user.name || (user.role === "PRINCIPAL" ? "মাওলানা আব্দুল করিম (প্রিন্সিপাল)" : "এডমিন অফিস"),
        role: user.role as "ADMIN" | "PRINCIPAL",
      },
      notes,
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      document: res.document,
      approvalRecord: res.approvalRecord,
    });
  } catch (err: any) {
    console.error("POST /api/governance/documents/[id]/approve error:", err);
    return NextResponse.json({ error: err.message || "Failed to process approval" }, { status: 500 });
  }
}
