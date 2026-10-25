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
    const requirementId = searchParams.get("requirementId");

    let reviews = ComplianceStore.getReviews();
    if (obligationId) {
      reviews = reviews.filter((r) => r.obligationId === obligationId);
    }
    if (requirementId) {
      reviews = reviews.filter((r) => r.requirementId === requirementId);
    }

    return NextResponse.json({
      success: true,
      data: reviews,
      count: reviews.length,
    });
  } catch (err: any) {
    console.error("[API Reviews GET] Error:", err);
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
        { success: false, error: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অধ্যক্ষ ও অ্যাডমিনের পর্যালোচনা চূড়ান্ত করার অনুমতি রয়েছে।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "মুহতামিম / অধ্যক্ষ সাহেব",
      userRole: user.role,
    };

    const review = ComplianceReviewEngine.recordComplianceReview(body, actor);

    return NextResponse.json({
      success: true,
      data: review,
      message: "কমপ্লায়েন্স পর্যালোচনা সফলভাবে সম্পন্ন ও ফলাফল সংরক্ষিত হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Reviews POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "পর্যালোচনা সংরক্ষণে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
