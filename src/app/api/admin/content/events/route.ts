import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getCmsEvents, saveCmsEvent, archiveCmsEvent } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const events = getCmsEvents(false);
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Admin Events GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const event = saveCmsEvent(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "অনুষ্ঠান সফলভাবে সংরক্ষিত হয়েছে।",
      event,
    });
  } catch (error: any) {
    console.error("Admin Events POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }
    const archived = archiveCmsEvent(id, "ADMIN");
    return NextResponse.json({
      success: archived,
      messageBn: archived ? "অনুষ্ঠান সফলভাবে আর্কাইভ করা হয়েছে।" : "অনুষ্ঠান খুঁজে পাওয়া যায়নি।",
    });
  } catch (error: any) {
    console.error("Admin Events DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to archive event" }, { status: 500 });
  }
}
