import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { changeEmployeeStatus, EmploymentStatus } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন কর্মসংস্থান স্ট্যাটাস পরিবর্তন করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { newStatus, effectiveDate, reason, remarks } = body;

    if (!newStatus || !reason) {
      return NextResponse.json({ error: "নতুন স্ট্যাটাস ও পরিবর্তনের কারণ উল্লেখ আবশ্যক।" }, { status: 400 });
    }

    const updated = await changeEmployeeStatus({
      employeeId: params.id,
      newStatus: newStatus as EmploymentStatus,
      effectiveDate,
      reason,
      remarks,
      recordedByUserId: user.userId,
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error("Change employee status error:", error);
    return NextResponse.json(
      { error: error.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
