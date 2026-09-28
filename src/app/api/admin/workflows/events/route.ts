import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { loadDomainEvents } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। অ্যাডমিন বা অধ্যক্ষের অনুমোদন প্রয়োজন।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get("eventType");
    const sourceModule = searchParams.get("sourceModule");
    const correlationId = searchParams.get("correlationId");

    let events = loadDomainEvents();

    if (eventType) {
      events = events.filter((e) => e.eventType === eventType);
    }
    if (sourceModule) {
      events = events.filter((e) => e.sourceModule === sourceModule);
    }
    if (correlationId) {
      events = events.filter((e) => e.correlationId === correlationId);
    }

    return NextResponse.json({
      success: true,
      data: {
        total: events.length,
        events: events.reverse(), // latest first
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve domain events" },
      { status: 500 }
    );
  }
}
