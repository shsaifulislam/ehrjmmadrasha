import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordUserAcknowledgement } from "@/lib/policies";
import { getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { version } = body;

    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = getClientIp(req);

    const res = recordUserAcknowledgement({
      documentIdOrCode: id,
      version,
      user: {
        id: user.userId,
        name: user.name || "User",
        role: user.role as any,
      },
      deviceMetadata: {
        userAgent,
        ipAddress,
      },
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: res.message,
      acknowledgement: res.acknowledgement,
    });
  } catch (err: any) {
    console.error("POST /api/governance/documents/[id]/acknowledge error:", err);
    return NextResponse.json({ error: err.message || "Failed to record acknowledgement" }, { status: 500 });
  }
}
