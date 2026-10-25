import { NextRequest, NextResponse } from "next/server";
import { getEvents, getEventTypes, createEvent } from "@/lib/events";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const typeCode = searchParams.get("type");
    const isPublicParam = searchParams.get("isPublic");
    const role = searchParams.get("role") || "PUBLIC";
    const search = searchParams.get("search")?.toLowerCase();

    let events = getEvents();

    // If PUBLIC role or isPublicParam === "true", filter private/drafts
    if (role === "PUBLIC" || isPublicParam === "true") {
      events = events.filter(
        (e) =>
          e.isPublic &&
          !["DRAFT", "REVIEW", "CANCELLED", "ARCHIVED"].includes(e.status)
      );
    }

    if (status) {
      events = events.filter((e) => e.status === status);
    }

    if (typeCode) {
      events = events.filter((e) => e.typeCode === typeCode);
    }

    if (search) {
      events = events.filter(
        (e) =>
          e.titleBn.toLowerCase().includes(search) ||
          (e.titleEn && e.titleEn.toLowerCase().includes(search)) ||
          e.venueText.toLowerCase().includes(search)
      );
    }

    const types = getEventTypes();

    return NextResponse.json({
      success: true,
      count: events.length,
      types,
      data: events,
    });
  } catch (error: any) {
    console.error("[API /api/events] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !["ADMIN", "PRINCIPAL"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন বা অধ্যক্ষ নতুন ইভেন্ট তৈরি করতে পারবেন।" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const result = createEvent({
      typeCode: body.typeCode || "OTHER",
      titleBn: body.titleBn,
      titleEn: body.titleEn,
      titleAr: body.titleAr,
      descriptionBn: body.descriptionBn || "",
      descriptionEn: body.descriptionEn,
      organizer: body.organizer || "মাদরাসা কর্তৃপক্ষ",
      sessionId: body.sessionId || "SESSION-2026",
      sessionName: body.sessionName || "২০২৬ শিক্ষাবর্ষ",
      audienceRule: body.audienceRule || { audienceTypes: ["ALL_STUDENTS"] },
      startAt: body.startAt,
      endAt: body.endAt,
      registrationOpensAt: body.registrationOpensAt,
      registrationClosesAt: body.registrationClosesAt,
      venueText: body.venueText || "মাদরাসা প্রাঙ্গণ",
      resourceId: body.resourceId,
      isRegistrationRequired: Boolean(body.isRegistrationRequired),
      maxCapacity: Number(body.maxCapacity) || 0,
      waitlistCapacity: Number(body.waitlistCapacity) || 0,
      isPublic: Boolean(body.isPublic),
      status: body.status || "DRAFT",
      leadTeacherId: body.leadTeacherId,
      assignedTeacherIds: body.assignedTeacherIds || [],
      bannerUrl: body.bannerUrl,
      instructionsBn: body.instructionsBn,
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      hasFee: Boolean(body.hasFee),
      feeAmount: body.feeAmount ? Number(body.feeAmount) : 0,
      createdBy: user.email || user.username || user.userId,
      updatedBy: user.email || user.username || user.userId,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.event }, { status: 201 });
  } catch (error: any) {
    console.error("[API /api/events] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}
