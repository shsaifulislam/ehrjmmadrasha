import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateSupplier } from "@/lib/inventoryEngine";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateSupplier(params.id, body, user.userId);
    return NextResponse.json({ success: true, supplier: updated });
  } catch (error: any) {
    console.error("Update supplier error:", error);
    return NextResponse.json(
      { error: error.message || "সরবরাহকারী তথ্য আপডেট করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
