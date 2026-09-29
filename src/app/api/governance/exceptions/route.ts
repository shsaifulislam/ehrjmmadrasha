import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllExceptions,
  recordException,
  recordAuditLog,
  getDocumentById,
  PolicyException,
} from "@/lib/policies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const exceptions = getAllExceptions();
    return NextResponse.json({
      success: true,
      totalCount: exceptions.length,
      exceptions,
    });
  } catch (err: any) {
    console.error("GET /api/governance/exceptions error:", err);
    return NextResponse.json({ error: err.message || "Failed to load exceptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। কেবলমাত্র প্রিন্সিপাল বা অনুমোদিত এডমিন বিশেষ ব্যতিক্রম মঞ্জুর করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      documentId,
      subject,
      reason,
      startDate,
      endDate,
      scope,
      conditions,
    } = body;

    if (!documentId || !subject || !reason || !startDate || !endDate) {
      return NextResponse.json(
        { error: "ডকুমেন্ট আইডি, বিষয়, কারণ, শুরুর ও সমাপ্তির তারিখ প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const doc = getDocumentById(documentId);
    if (!doc) {
      return NextResponse.json({ error: "নীতিমালা খুঁজে পাওয়া যায়নি।" }, { status: 404 });
    }

    const excId = `EHRJ-EXC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const auditRef = `AUD-EXC-${Date.now()}`;

    const newException: PolicyException = {
      id: excId,
      documentId: doc.id,
      documentCode: doc.documentCode,
      version: doc.currentVersion,
      subject,
      reason,
      approvedBy: user.name || "মাওলানা আব্দুল করিম (প্রিন্সিপাল)",
      startDate,
      endDate,
      scope: scope || "নির্দিষ্ট ক্ষেত্র",
      conditions: conditions || "শর্ত প্রযোজ্য",
      status: "ACTIVE",
      auditRef,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    recordException(newException);

    recordAuditLog({
      documentId: doc.id,
      documentCode: doc.documentCode,
      version: doc.currentVersion,
      action: "GRANT_EXCEPTION",
      actorId: user.userId,
      actorName: user.name || "Admin",
      actorRole: user.role,
      notes: `Exception granted: ${subject} (${reason})`,
      details: { excId, auditRef },
    });

    return NextResponse.json({
      success: true,
      message: "নীতিমালা ব্যতিক্রম সফলভাবে নিবন্ধিত হয়েছে।",
      exception: newException,
    });
  } catch (err: any) {
    console.error("POST /api/governance/exceptions error:", err);
    return NextResponse.json({ error: err.message || "Failed to create exception" }, { status: 500 });
  }
}
