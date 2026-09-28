import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getMaintenanceState, setMaintenanceState } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const state = await getMaintenanceState();
    return NextResponse.json({ success: true, maintenance: state });
  } catch (error: any) {
    console.error("Maintenance GET Error:", error);
    return NextResponse.json(
      { error: error.message || "রক্ষণাবেক্ষণ অবস্থা লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন মেইনটেনেন্স মোড নিয়ন্ত্রণ করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive মান (true অথবা false) আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await setMaintenanceState({
      isActive: body.isActive,
      reason: body.reason || "Scheduled infrastructure maintenance",
      messageBn: body.messageBn,
      messageEn: body.messageEn,
      enabledById: user.userId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Maintenance POST Error:", error);
    return NextResponse.json(
      { error: error.message || "মেইনটেনেন্স মোড আপডেট করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
