import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAllCertificates, renewCertificate } from "@/lib/training";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const allCerts = getAllCertificates();
    const today = new Date().toISOString().split("T")[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const isAdmin = user.role === "ADMIN" || user.role === "PRINCIPAL";

    let certs = allCerts;
    if (!isAdmin) {
      certs = certs.filter((c) => c.employeeId === user.userId || c.employeeName === user.username);
    }

    const expiringSoon = certs.filter(
      (c) => c.validUntil && c.validUntil <= in30Days && c.validUntil >= today && c.status === "VALID"
    );

    const expired = certs.filter(
      (c) => c.validUntil && c.validUntil < today
    );

    return NextResponse.json({
      success: true,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
      expiringSoon,
      expired,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch renewals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { certificateId } = body;

    if (!certificateId) {
      return NextResponse.json(
        { success: false, error: "সনদপত্র আইডি আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor = {
      actorId: user.userId,
      actorName: user.username || "Admin",
      actorRole: user.role,
    };

    const result = renewCertificate(certificateId, actor);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `সনদ সফলভাবে নবায়ন করা হয়েছে। নতুন মেয়াদ: ${result.certificate?.validUntil}`,
      certificate: result.certificate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to renew certificate" },
      { status: 500 }
    );
  }
}
