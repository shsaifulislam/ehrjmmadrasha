import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ComplianceStore,
  EvidenceVerificationEngine,
  ActorContext,
} from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const obligationId = searchParams.get("obligationId");
    const status = searchParams.get("status");

    let list = ComplianceStore.getEvidence();
    if (obligationId) {
      list = list.filter((e) => e.obligationId === obligationId);
    }
    if (status) {
      list = list.filter((e) => e.verificationStatus === status);
    }

    return NextResponse.json({
      success: true,
      data: list,
      count: list.length,
    });
  } catch (err: any) {
    console.error("[API Evidence GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "অ্যাডমিনিস্ট্রেটর",
      userRole: user.role,
    };

    const newEvidence = EvidenceVerificationEngine.recordEvidence(body, actor);

    return NextResponse.json({
      success: true,
      data: newEvidence,
      message: "কমপ্লায়েন্স প্রমাণপত্র রেফারেন্স সফলভাবে আপলোড ও রেকর্ড হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Evidence POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "প্রমাণপত্র সংরক্ষণে ব্যর্থ।" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অধ্যক্ষ ও অ্যাডমিনের প্রমাণ যাচাইয়ের অনুমতি রয়েছে।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "মুহতামিম / অধ্যক্ষ সাহেব",
      userRole: user.role,
    };

    const updated = EvidenceVerificationEngine.verifyEvidence(
      body.evidenceId,
      body.verificationStatus,
      body.notes || "যাচাইকৃত",
      actor
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `প্রমাণপত্র সফলভাবে '${body.verificationStatus}' হিসেবে যাচাই করা হয়েছে।`,
    });
  } catch (err: any) {
    console.error("[API Evidence PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "প্রমাণপত্র যাচাইয়ে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
