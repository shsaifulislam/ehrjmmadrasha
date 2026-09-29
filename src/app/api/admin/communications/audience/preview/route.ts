import { NextRequest, NextResponse } from "next/server";
import { resolveAudienceRecipients } from "@/lib/communications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const audienceType = body.audienceType || "ALL_GUARDIANS";
    const filter = body.audienceFilter || {};

    const recipients = await resolveAudienceRecipients(audienceType, filter);

    return NextResponse.json({
      success: true,
      audienceType,
      totalCount: recipients.length,
      sampleRecipients: recipients.slice(0, 10).map((r) => ({
        recipientId: r.recipientId,
        name: r.name,
        role: r.role,
        email: r.email,
        phone: r.phone ? `${r.phone.slice(0, 4)}***${r.phone.slice(-3)}` : undefined,
        studentNameBn: r.studentNameBn,
        classTitle: r.classTitle,
        reason: r.reasonForInclusion,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
