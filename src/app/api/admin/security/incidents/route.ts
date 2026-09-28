import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSecurityIncident, updateIncidentStatus } from "@/lib/securityEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র অ্যাডমিন প্রবেশের অধিকার রয়েছে।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const incidents = await prisma.systemIncident.findMany({
      where: {
        ...(statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      include: {
        events: {
          orderBy: { timestamp: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: {
        incidents,
        total: incidents.length,
      },
    });
  } catch (error: any) {
    console.error("Incidents GET Error:", error);
    return NextResponse.json(
      { error: "নিরাপত্তা ইনসিডেন্ট তালিকা লোড করতে ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, incidentId, title, description, severity, newStatus, resolutionNotes } = body;

    if (action === "CREATE_INCIDENT") {
      if (!title || !description) {
        return NextResponse.json({ error: "শিরোনাম ও বিবরণ আবশ্যক।" }, { status: 400 });
      }

      const incident = await createSecurityIncident({
        title,
        description,
        severity: severity || "MEDIUM",
        affectedService: "SECURITY",
        detectedById: user.userId,
      });

      return NextResponse.json({
        success: true,
        message: "নিরাপত্তা ইনসিডেন্ট সফলভাবে রেকর্ড করা হয়েছে।",
        data: { incident },
      });
    }

    if (action === "UPDATE_STATUS") {
      if (!incidentId || !newStatus) {
        return NextResponse.json({ error: "ইনসিডেন্ট আইডি ও স্ট্যাটাস আবশ্যক।" }, { status: 400 });
      }

      const updated = await updateIncidentStatus(
        incidentId,
        newStatus,
        user.name,
        resolutionNotes
      );

      return NextResponse.json({
        success: true,
        message: `ইনসিডেন্ট স্ট্যাটাস '${newStatus}' এ পরিবর্তিত হয়েছে।`,
        data: { incident: updated },
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error: any) {
    console.error("Incidents POST Error:", error);
    return NextResponse.json(
      { error: "ইনসিডেন্ট প্রক্রিয়াকরণে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
