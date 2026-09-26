import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { reissueDocument } from "@/lib/documentFactory";

/**
 * POST /api/admin/documents/[id]/reissue
 * Reissue an official document, incrementing version and generating fresh snapshot & token
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন প্রত্যয়নপত্র পুনরায় ইস্যু করতে পারেন।" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { reason, customNotes } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "পুনরায় ইস্যু করার কারণ উল্লেখ করা আবশ্যক।" }, { status: 400 });
    }

    const reissuedCert = await reissueDocument({
      originalCertificateId: id,
      issuedByUserId: user.userId,
      reason: reason.trim(),
      customNotes,
    });

    await recordAuditLog({
      userId: user.userId,
      action: "REISSUE_OFFICIAL_DOCUMENT",
      entityType: "Certificate",
      entityId: reissuedCert.id,
      details: {
        originalId: id,
        newCertificateNumber: reissuedCert.certificateNumber,
        newVersion: reissuedCert.version,
        reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `প্রত্যয়নপত্র সফলভাবে পুনরায় ইস্যু করা হয়েছে (ভার্সন ${reissuedCert.version})।`,
      certificate: reissuedCert,
    });
  } catch (error: any) {
    console.error("Admin Document Reissue error:", error);
    return NextResponse.json(
      { error: error.message || "প্রত্যয়নপত্র পুনরায় ইস্যু করা সম্ভব হয়নি।" },
      { status: 400 }
    );
  }
}
