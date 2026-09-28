import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateDepartment } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const department = await updateDepartment(params.id, {
      ...body,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, department });
  } catch (error: any) {
    console.error("Update HR department error:", error);
    return NextResponse.json(
      { error: error.message || "দপ্তর হালনাগাদ ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
