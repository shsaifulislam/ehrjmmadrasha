import { NextRequest, NextResponse } from "next/server";
import { recordEventAttendance, getEventAttendance, getEventById } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "TEACHER";

    if (role === "PUBLIC") {
      return NextResponse.json(
        { success: false, error: "উপস্থিতি বিবরণ শুধুমাত্র অনুমোদিত শিক্ষক ও প্রশাসনের জন্য।" },
        { status: 403 }
      );
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
  { params }: { params: { id: string } }
) {
  try {
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
      recordedByTeacherId: body.teacherId || "STAFF-01",
      recordedByTeacherName: body.teacherName || "সহকারী শিক্ষক",
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
