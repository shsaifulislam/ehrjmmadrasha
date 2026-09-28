import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listSystemIncidents, createSystemIncident } from "@/lib/operationsEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const severity = searchParams.get("severity") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    const incidents = await listSystemIncidents({ status, severity, limit });
    return NextResponse.json({ success: true, incidents });
  } catch (error: any) {
    console.error("Incidents List Error:", error);
    return NextResponse.json(
      { error: error.message || "ইনসিডেন্ট তালিকা লোড করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত: শুধুমাত্র অ্যাডমিন নতুন ইনসিডেন্ট তৈরি করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "ইনসিডেন্টের শিরোনাম এবং বিবরণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const incident = await createSystemIncident({
      title: body.title,
      description: body.description,
      severity: body.severity,
      affectedService: body.affectedService,
      detectedById: user.userId,
      detectedByName: user.name,
      assignedToId: body.assignedToId,
    });

    return NextResponse.json({ success: true, incident }, { status: 201 });
  } catch (error: any) {
    console.error("Incident Create Error:", error);
    return NextResponse.json(
      { error: error.message || "ইনসিডেন্ট তৈরি করতে ব্যর্থ।" },
      { status: 500 }
    );
  }
}
