import { NextRequest, NextResponse } from "next/server";
import {
  getCertificateLinks,
  issueEventCertificate,
  revokeEventCertificate,
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
    const studentId = searchParams.get("studentId");

    let certs = getCertificateLinks().filter((c) => c.eventId === params.id && !c.isRevoked);

    if (studentId) {
      certs = certs.filter((c) => c.studentId === studentId);
    }

    return NextResponse.json({
      success: true,
      count: certs.length,
      data: certs,
    });
  } catch (error: any) {
    console.error("[API /api/events/[id]/certificates] GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load certificates" },
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
    const actorRole = body.actorRole || "ADMIN";
    const actorId = body.actorId || "admin@ehrj.edu.bd";

    if (!body.studentId || !body.category) {
      return NextResponse.json(
        { success: false, error: "শিক্ষার্থী আইডি এবং সনদপত্রের ধরন (category) আবশ্যক।" },
        { status: 400 }
      );
    }

    const res = await issueEventCertificate({
      eventId: params.id,
      studentId: body.studentId,
      category: body.category,
      awardTextBn: body.awardTextBn,
      issuedByUserId: actorId,
      actorRole,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: res.certificateLink }, { status: 201 });
  } catch (error: any) {
    console.error("[API /api/events/[id]/certificates] POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to issue certificate" },
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
    const certificateId = searchParams.get("certificateId");
    const reason = searchParams.get("reason") || "সনদপত্র প্রত্যাহার করা হলো।";
    const actorId = searchParams.get("actorId") || "admin@ehrj.edu.bd";
    const actorRole = searchParams.get("actorRole") || "ADMIN";

    if (!certificateId) {
      return NextResponse.json(
        { success: false, error: "সনদপত্র আইডি আবশ্যক।" },
        { status: 400 }
      );
    }

    const res = await revokeEventCertificate({
      certificateId,
      revokedByUserId: actorId,
      actorRole,
      reason,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "সনদপত্র সফলভাবে বাতিল করা হয়েছে।" });
  } catch (error: any) {
    console.error("[API /api/events/[id]/certificates] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke certificate" },
      { status: 500 }
    );
  }
}
