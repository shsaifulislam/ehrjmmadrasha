import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateInventoryLocation } from "@/lib/inventoryEngine";

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
    const updated = await updateInventoryLocation(params.id, body, user.userId);
    return NextResponse.json({ success: true, location: updated });
  } catch (error: any) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: error.message || "লোকেশন আপডেট করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
