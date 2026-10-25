import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { revokeDocument } from "@/lib/documentFactory";

/**
 * POST /api/admin/documents/[id]/revoke
 * Revoke an issued document with mandatory reason and audit trail
 */
export async function POST(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন প্রত্যয়নপত্র বাতিল করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "বাতিলকরণের সুনির্দিষ্ট কারণ উল্লেখ করা আবশ্যক।" }, { status: 400 });
    }

    const revokedCert = await revokeDocument({
      certificateId: id,
      revokedByUserId: user.userId,
      reason: reason.trim(),
    });

    await recordAuditLog({
      userId: user.userId,
      action: "REVOKE_OFFICIAL_DOCUMENT",
      entityType: "Certificate",
      entityId: id,
      details: {
        certificateNumber: revokedCert.certificateNumber,
        reason: reason.trim(),
        revokedAt: revokedCert.revokedAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "প্রত্যয়নপত্র সফলভাবে বাতিল (REVOKED) করা হয়েছে।",
      certificate: revokedCert,
    });
  } catch (error: any) {
    console.error("Admin Document Revoke error:", error);
    return NextResponse.json(
      { error: error.message || "প্রত্যয়নপত্র বাতিল করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
