import { NextRequest, NextResponse } from "next/server";
import { requestResourceBooking } from "@/lib/calendar/resourceBookingEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      resourceId,
      title,
      purpose,
      requestedBy,
      requestedByName,
      requestedByRole,
      startAt,
      endAt,
      participantCount,
    } = body;

    if (!resourceId || !title || !startAt || !endAt || !requestedBy) {
      return NextResponse.json(
        { success: false, error: "রিসোর্স, শিরোনাম, শুরুর সময় এবং শেষ সময় আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = requestResourceBooking({
      resourceId,
      title,
      purpose: purpose || "প্রাতিষ্ঠানিক অনুষ্ঠান বা পাঠদান",
      requestedBy,
      requestedByName: requestedByName || "মাদরাসা ব্যবহারকারী",
      requestedByRole: requestedByRole || "TEACHER",
      startAt,
      endAt,
      participantCount: Number(participantCount) || 1,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "বুকিং সফলভাবে সম্পন্ন হয়েছে",
      booking: result.booking,
    });
  } catch (error: any) {
    console.error("[API /api/calendar/resources/book] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to book resource" },
      { status: 500 }
    );
  }
}
