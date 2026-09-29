import { NextRequest, NextResponse } from "next/server";
import { getEventById, transitionEventStatus, getEvents, saveEvents, appendEventAudit } from "@/lib/events";

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

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error("[API /api/events/[id]] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const actorId = body.actorId || "admin@ehrj.edu.bd";
    const actorRole = body.actorRole || "ADMIN";

    // 1. If status transition requested
    if (body.targetStatus && body.targetStatus !== event.status) {
      const transResult = transitionEventStatus({
        eventId: params.id,
        targetStatus: body.targetStatus,
        actorId,
        actorRole,
        reason: body.reason,
      });

      if (!transResult.success) {
        return NextResponse.json({ success: false, error: transResult.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: transResult.event });
    }

    // 2. Regular field update
    if (!["ADMIN", "PRINCIPAL"].includes(actorRole)) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত: শুধুমাত্র প্রশাসন ইভেন্ট সম্পাদনা করতে পারবেন।" },
        { status: 403 }
      );
    }

    const events = getEvents();
    const index = events.findIndex((e) => e.id === params.id);
    if (index >= 0) {
      const updated = {
        ...events[index],
        ...body,
        id: event.id, // prevent id change
        version: events[index].version + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: actorId,
      };
      events[index] = updated;
      saveEvents(events);

      appendEventAudit({
        eventId: event.id,
        action: "UPDATE_EVENT",
        actorId,
        actorRole,
        details: `ইভেন্ট তথ্য হালনাগাদ করা হয়েছে: ${event.titleBn}`,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: "ইভেন্ট আপডেট ব্যর্থ হয়েছে।" }, { status: 400 });
  } catch (error: any) {
    console.error("[API /api/events/[id]] PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update event" },
      { status: 500 }
    );
  }
}
