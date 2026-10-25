import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteSavedReport } from "@/lib/analyticsEngine";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    await deleteSavedReport(params.id, user.userId);
    return NextResponse.json({ success: true, message: "রিপোর্টটি সফলভাবে ডিলিট করা হয়েছে।" });
  } catch (error: any) {
    console.error("Saved Report DELETE Error:", error);
    return NextResponse.json(
      { error: error.message || "রিপোর্ট ডিলিট করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
