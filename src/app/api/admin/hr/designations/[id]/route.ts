import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateDesignation } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const designation = await updateDesignation(params.id, {
      ...body,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, designation });
  } catch (error: any) {
    console.error("Update HR designation error:", error);
    return NextResponse.json(
      { error: error.message || "পদবি হালনাগাদ ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
