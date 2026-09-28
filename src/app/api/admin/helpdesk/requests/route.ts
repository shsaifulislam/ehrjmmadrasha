import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSupportRequests, createSupportRequest } from "@/lib/helpdeskEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const ticketNumber = searchParams.get("ticketNumber") || undefined;
    const status = searchParams.get("status") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const categoryCode = searchParams.get("categoryCode") || undefined;
    const requestType = searchParams.get("requestType") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const guardianId = searchParams.get("guardianId") || undefined;
    const search = searchParams.get("search") || undefined;
    const isUrgent = searchParams.get("isUrgent") === "true";
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const data = await getSupportRequests({
      ticketNumber,
      status,
      categoryId,
      categoryCode,
      requestType,
      priority,
      studentId,
      guardianId,
      search,
      isUrgent,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Admin Helpdesk Requests GET error:", error);
    return NextResponse.json(
      { error: error.message || "অনুরোধ তালিকা লোড করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.categoryCode || !body.requestType || !body.subject || !body.description) {
      return NextResponse.json(
        { error: "ক্যাটাগরি, ধরন, বিষয় ও বিবরণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const ticket = await createSupportRequest({
      userId: user.userId,
      role: user.role,
      guardianId: body.guardianId || undefined,
      studentId: body.studentId || undefined,
      categoryCode: body.categoryCode,
      requestType: body.requestType,
      priority: body.priority,
      subject: body.subject,
      description: body.description,
      relatedEntityType: body.relatedEntityType,
      relatedEntityId: body.relatedEntityId,
      attachments: body.attachments,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Admin Helpdesk Requests POST error:", error);
    return NextResponse.json(
      { error: error.message || "অনুরোধ তৈরি ব্যর্থ হয়েছে।" },
      { status: 400 }
    );
  }
}
