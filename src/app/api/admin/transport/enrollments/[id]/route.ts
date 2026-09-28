import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { changeStudentTransportRoute, cancelStudentTransport } from "@/lib/transportEngine";

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

    const { id } = params;
    const body = await req.json();
    const { newRouteId, newPickupStopId, newDropStopId, newMonthlyFee, reason } = body;

    if (!newRouteId) {
      return NextResponse.json({ error: "নতুন রুট নির্বাচন করা আবশ্যক।" }, { status: 400 });
    }

    const updated = await changeStudentTransportRoute({
      enrollmentId: id,
      newRouteId,
      newPickupStopId,
      newDropStopId,
      newMonthlyFee: newMonthlyFee !== undefined ? Number(newMonthlyFee) : undefined,
      reason,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, enrollment: updated });
  } catch (error: any) {
    console.error("Change student transport route error:", error);
    return NextResponse.json(
      { error: error.message || "রুট পরিবর্তন করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { id } = params;
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason") || "অ্যাডমিন দ্বারা বাতিল";

    const cancelled = await cancelStudentTransport({
      enrollmentId: id,
      reason,
      adminUserId: user.userId,
    });

    return NextResponse.json({ success: true, enrollment: cancelled });
  } catch (error: any) {
    console.error("Cancel student transport error:", error);
    return NextResponse.json(
      { error: error.message || "পরিবহন সেবা বাতিল করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
