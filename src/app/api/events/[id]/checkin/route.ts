import { NextRequest, NextResponse } from "next/server";
import { recordEventAttendance, getEventAttendance, getEventById } from "@/lib/events";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "উপস্থিতি বিবরণ শুধুমাত্র অনুমোদিত শিক্ষক ও প্রশাসনের জন্য।" },
        { status: 403 }
      );
    }

    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const records = getEventAttendance(params.id);

    return NextResponse.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error: any) {
    console.error("[API /api/events/[id]/checkin] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load attendance" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত: শুধুমাত্র শিক্ষক ও প্রশাসন উপস্থিতি রেকর্ড করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.studentIdOrCode) {
      return NextResponse.json(
        { success: false, error: "শিক্ষার্থীর আইডি বা কিউআর কোড আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await recordEventAttendance({
      eventId: params.id,
      studentIdOrCode: body.studentIdOrCode,
      status: body.status || "PRESENT",
      recordedByTeacherId: user.email || user.username || user.userId,
      recordedByTeacherName: user.name || "সহকারী শিক্ষক",
      recordedMethod: body.recordedMethod || "QR_SCAN",
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, attendance: result.attendance },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.attendance });
  } catch (error: any) {
    console.error("[API /api/events/[id]/checkin] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process check-in" },
      { status: 500 }
    );
  }
}
