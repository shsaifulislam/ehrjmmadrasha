import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markBookCopyLost } from "@/lib/libraryEngine";

/**
 * POST /api/admin/library/copies/[id]/lost
 * Mark a copy as lost and calculate replacement charge through Phase 6 Finance
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন বইটি হারানো চিহ্নিত করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { notes, customCharge } = body;

    const result = await markBookCopyLost({
      copyId: id,
      reportedByUserId: user.userId,
      notes,
      customCharge: customCharge !== undefined ? Number(customCharge) : undefined,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "বই হারানো রিপোর্ট প্রক্রিয়াকরণে ব্যর্থ।" }, { status: 400 });
  }
}
