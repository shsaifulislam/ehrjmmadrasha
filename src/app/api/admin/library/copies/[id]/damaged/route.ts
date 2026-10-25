import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markBookCopyDamaged } from "@/lib/libraryEngine";

/**
 * POST /api/admin/library/copies/[id]/damaged
 * Record damage for a copy and apply fine if active borrower is responsible
 */
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন ক্ষতিগ্রস্ত বই এন্ট্রি করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { description, chargeAmount, setRepair } = body;

    if (!description) {
      return NextResponse.json({ error: "ক্ষতির বিবরণ আবশ্যক।" }, { status: 400 });
    }

    const result = await markBookCopyDamaged({
      copyId: id,
      reportedByUserId: user.userId,
      description,
      chargeAmount: chargeAmount ? Number(chargeAmount) : 0,
      setRepair: Boolean(setRepair),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "ক্ষতিগ্রস্ত রিপোর্ট প্রক্রিয়াকরণে ব্যর্থ।" }, { status: 400 });
  }
}
