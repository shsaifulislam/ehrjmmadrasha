import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ComplianceStore,
  ComplianceReviewEngine,
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

    let remediations = ComplianceStore.getRemediations();
    if (obligationId) {
      remediations = remediations.filter((r) => r.obligationId === obligationId);
    }

    return NextResponse.json({
      success: true,
      data: remediations,
      count: remediations.length,
    });
  } catch (err: any) {
    console.error("[API Remediation GET] Error:", err);
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

    const newRemediation = ComplianceReviewEngine.createRemediation(body, actor);

    return NextResponse.json({
      success: true,
      data: newRemediation,
      message: "সংশোধনমূলক কর্মপরিকল্পনা সফলভাবে গৃহীত হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Remediation POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "প্রতিকার কর্মপরিকল্পনা তৈরিতে ব্যর্থ।" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অধ্যক্ষ ও অ্যাডমিনের প্রতিকার যাচাই ও সমাপ্ত করার অনুমতি রয়েছে।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "মুহতামিম / অধ্যক্ষ সাহেব",
      userRole: user.role,
    };

    const updated = ComplianceReviewEngine.verifyAndCloseRemediation(
      body.remediationId,
      Boolean(body.isVerified),
      body.verificationNotes || "সফলভাবে প্রতিপালিত ও যাচাইকৃত",
      actor
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: updated.status === "CLOSED" ? "প্রতিকার যাচাই সম্পন্ন ও সমাপ্ত হয়েছে।" : "প্রতিকার পুনরায় পর্যবেক্ষণাধীন রাখা হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Remediation PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "যাচাইকরণে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
