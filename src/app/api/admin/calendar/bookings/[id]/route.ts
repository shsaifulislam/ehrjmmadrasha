import { NextRequest, NextResponse } from "next/server";
import {
  approveResourceBooking,
  rejectResourceBooking,
  cancelResourceBooking,
} from "@/lib/calendar/resourceBookingEngine";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, actorId, notes, reason } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "অ্যাকশন নির্দিষ্ট করা হয়নি।" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      const res = approveResourceBooking(params.id, actorId || "admin", notes);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 409 });
      }
      return NextResponse.json({
        success: true,
        message: "বুকিং সফলভাবে অনুমোদন করা হয়েছে",
        booking: res.booking,
      });
    }

    if (action === "REJECT") {
      const res = rejectResourceBooking(
        params.id,
        actorId || "admin",
        reason || "প্রশাসনিক সিদ্ধান্তে বাতিল"
      );
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "বুকিং প্রত্যাখ্যান করা হয়েছে",
        booking: res.booking,
      });
    }

    if (action === "CANCEL") {
      const res = cancelResourceBooking(
        params.id,
        actorId || "admin",
        reason || "ব্যবহারকারী কর্তৃক বাতিল"
      );
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "বুকিং বাতিল করা হয়েছে",
        booking: res.booking,
      });
    }

    return NextResponse.json(
      { success: false, error: "অসমর্থিত অ্যাকশন।" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API /api/admin/calendar/bookings/[id] PUT] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}
