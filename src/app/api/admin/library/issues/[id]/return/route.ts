import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { returnBookCopy } from "@/lib/libraryEngine";

/**
 * POST /api/admin/library/issues/[id]/return
 * Return an issued book, calculate fine, and trigger Phase 6 invoice if applicable
 */
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন বই ফেরত গ্রহণ করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { condition, damageCharge, notes } = body;

    const returnedIssue = await returnBookCopy({
      issueId: id,
      returnedByUserId: user.userId,
      condition,
      damageCharge: damageCharge ? Number(damageCharge) : 0,
      notes,
    });

    return NextResponse.json({ success: true, issue: returnedIssue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "বই ফেরত গ্রহণে ব্যর্থ।" }, { status: 400 });
  }
}
