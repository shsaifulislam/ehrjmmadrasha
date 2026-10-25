import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { renewBookCopy } from "@/lib/libraryEngine";

/**
 * POST /api/admin/library/issues/[id]/renew
 * Renew an issued book within policy limits
 */
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন বই নবায়ন করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { notes } = body;

    const renewedIssue = await renewBookCopy({
      issueId: id,
      renewedByUserId: user.userId,
      notes,
    });

    return NextResponse.json({ success: true, issue: renewedIssue });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "বই নবায়ন ব্যর্থ।" }, { status: 400 });
  }
}
