import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { generateInstitutionalDigest } from "@/lib/communications";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json().catch(() => ({}));
    const digestType = body.digestType === "WEEKLY" ? "WEEKLY" : "DAILY";
    const targetRole = body.targetRole || "GUARDIAN";
    const dispatchLive = !!body.dispatchLive;

    const digest = await generateInstitutionalDigest({
      digestType,
      targetRole,
      dispatchLive,
      actorId: body.actorId || "ADMIN",
    });

    return NextResponse.json({ success: true, digest });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
