import { NextRequest, NextResponse } from "next/server";
import {
  registerStudentForEvent,
  cancelEventRegistration,
  getRegistrations,
  getEventById,
} from "@/lib/events";

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
    const role = searchParams.get("role") || "ADMIN";

    // Public cannot view all private participant data
    if (role === "PUBLIC") {
      return NextResponse.json(
        { success: false, error: "অংশগ্রহণকারীদের ব্যক্তিগত তালিকা শুধুমাত্র অনুমোদিত ব্যবহারকারীদের জন্য।" },
        { status: 403 }
      );
    }

    const registrations = getRegistrations().filter((r) => r.eventId === params.id);

    return NextResponse.json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error: any) {
    console.error("[API /api/events/[id]/register] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load registrations" },
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

    if (!body.studentId) {
      return NextResponse.json({ success: false, error: "শিক্ষার্থী আইডি (studentId) আবশ্যক।" }, { status: 400 });
    }

    const result = await registerStudentForEvent({
      eventId: params.id,
      studentId: body.studentId,
      registeredByRole: body.registeredByRole || "GUARDIAN",
      registeredByUserId: body.registeredByUserId || "portal_user",
      guardianId: body.guardianId,
      consentGiven: Boolean(body.consentGiven),
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.registration }, { status: 201 });
  } catch (error: any) {
    console.error("[API /api/events/[id]/register] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register for event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get("registrationId");
    const reason = searchParams.get("reason") || "আবেদনকারী কর্তৃক বাতিল";
    const actorId = searchParams.get("actorId") || "system";
    const actorRole = searchParams.get("actorRole") || "GUARDIAN";

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "রেজিস্ট্রেশন আইডি আবশ্যক।" }, { status: 400 });
    }

    const result = await cancelEventRegistration({
      registrationId,
      actorId,
      actorRole,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "রেজিস্ট্রেশন সফলভাবে বাতিল করা হয়েছে।" });
  } catch (error: any) {
    console.error("[API /api/events/[id]/register] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel registration" },
      { status: 500 }
    );
  }
}
