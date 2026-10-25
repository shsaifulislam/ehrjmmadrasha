import { NextRequest, NextResponse } from "next/server";
import {
  registerStudentForEvent,
  cancelEventRegistration,
  getRegistrations,
  getEventById,
} from "@/lib/events";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত: অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      );
    }

    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const registrations = getRegistrations().filter((r) => r.eventId === params.id);

    // If GUARDIAN, filter to their student registrations
    const filtered = user.role === "GUARDIAN"
      ? registrations.filter(r => r.registeredByUserId === user.userId || r.guardianId === user.userId)
      : registrations;

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
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
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত: ইভেন্টে নিবন্ধনের জন্য লগইন আবশ্যক।" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.studentId) {
      return NextResponse.json({ success: false, error: "শিক্ষার্থী আইডি (studentId) আবশ্যক।" }, { status: 400 });
    }

    const result = await registerStudentForEvent({
      eventId: params.id,
      studentId: body.studentId,
      registeredByRole: (user.role === "PRINCIPAL" ? "ADMIN" : user.role) as any,
      registeredByUserId: user.userId,
      guardianId: user.role === "GUARDIAN" ? user.userId : body.guardianId,
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
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত: নিবন্ধন বাতিলের জন্য লগইন আবশ্যক।" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get("registrationId");
    const reason = searchParams.get("reason") || "আবেদনকারী কর্তৃক বাতিল";

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "রেজিস্ট্রেশন আইডি আবশ্যক।" }, { status: 400 });
    }

    const result = await cancelEventRegistration({
      registrationId,
      actorId: user.userId,
      actorRole: (user.role === "PRINCIPAL" ? "ADMIN" : user.role) as any,
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

