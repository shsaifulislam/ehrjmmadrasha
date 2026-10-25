import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEmployeeById, updateEmployee, generateEmployeeIdCardData } from "@/lib/hrEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cardOnly = searchParams.get("card") === "true";

    if (cardOnly) {
      const cardData = await generateEmployeeIdCardData(params.id);
      return NextResponse.json({ success: true, cardData });
    }

    const employee = await getEmployeeById(params.id);
    if (!employee) {
      return NextResponse.json({ error: "কর্মী পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    console.error("Get employee details error:", error);
    return NextResponse.json(
      { error: error.message || "কর্মী তথ্য লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন কর্মী তথ্য হালনাগাদ করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateEmployee(params.id, body, user.userId);

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: error.message || "কর্মী তথ্য হালনাগাদ ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
