import { NextRequest, NextResponse } from "next/server";
import { getEventFeedbacks, saveEventFeedbacks, getEventById } from "@/lib/events";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const sessionUser = await getSessionUser(request);
    const role = sessionUser?.role || "PUBLIC";

    const feedbacks = getEventFeedbacks().filter((f) => f.eventId === params.id);

    // If PUBLIC, sanitize and mask identifiers
    const sanitized = feedbacks.map((f) => {
      if (role === "PUBLIC" || f.isAnonymous) {
        return {
          id: f.id,
          eventId: f.eventId,
          isAnonymous: true,
          rating: f.rating,
          commentsBn: f.commentsBn,
          suggestionsBn: f.suggestionsBn,
          createdAt: f.createdAt,
        };
      }
      return f;
    });

    return NextResponse.json({
      success: true,
      count: sanitized.length,
      data: sanitized,
    });
  } catch (error: any) {
    console.error("[API /api/events/[id]/feedback] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load feedback" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const body = await request.json();
    const event = getEventById(params.id);
    if (!event) {
      return NextResponse.json({ success: false, error: "ইভেন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে ১ থেকে ৫ এর মধ্যে রেটিং দিন।" },
        { status: 400 }
      );
    }
    if (!body.commentsBn || !body.commentsBn.trim()) {
      return NextResponse.json(
        { success: false, error: "মতামত বা মন্তব্য আবশ্যক।" },
        { status: 400 }
      );
    }

    const feedbacks = getEventFeedbacks();
    const newFeedback = {
      id: `FDB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventId: params.id,
      studentId: body.isAnonymous ? undefined : body.studentId,
      guardianId: body.isAnonymous ? undefined : body.guardianId,
      isAnonymous: Boolean(body.isAnonymous),
      rating: Number(body.rating),
      commentsBn: body.commentsBn.trim(),
      suggestionsBn: body.suggestionsBn?.trim(),
      createdAt: new Date().toISOString(),
    };

    feedbacks.push(newFeedback);
    saveEventFeedbacks(feedbacks);

    return NextResponse.json({ success: true, data: newFeedback }, { status: 201 });
  } catch (error: any) {
    console.error("[API /api/events/[id]/feedback] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
