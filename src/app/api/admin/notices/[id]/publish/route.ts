import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { publishNotice } from "@/lib/communicationEngine";

export const dynamic = "force-dynamic";

/**
 * Admin Explicit Publish Notice API
 */
export async function POST(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const published = await publishNotice(params.id, user.userId);

    return NextResponse.json({
      success: true,
      message: "নোটিশ সফলভাবে প্রকাশিত হয়েছে এবং প্রাপকগণের নিকট বার্তা প্রেরণ করা হয়েছে।",
      notice: published,
      data: published,
    });
  } catch (error: any) {
    console.error("Publish Notice Error:", error);
    return NextResponse.json({ error: error.message || "নোটিশ প্রকাশ করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
