import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  GovernanceReviewEngine,
  ActorContext,
} from "@/lib/riskAssurance";

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

    const reviews = RiskAssuranceStore.getReviews();
    return NextResponse.json({
      success: true,
      total: reviews.length,
      reviews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list governance reviews." },
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
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    if (body.action === "COMPLETE_REVIEW") {
      if (!body.reviewId || !body.summaryDecisionsBn) {
        return NextResponse.json(
          { success: false, error: "অধিবেশন আইডি এবং সিদ্ধান্তের বিবরণ আবশ্যক।" },
          { status: 400 }
        );
      }

      const completed = GovernanceReviewEngine.completeReview(
        body.reviewId,
        {
          summaryDecisionsBn: body.summaryDecisionsBn,
          actionItemsCount: Number(body.actionItemsCount) || 0,
          evidenceRef: body.evidenceRef,
        },
        actor
      );

      return NextResponse.json({
        success: true,
        review: completed,
        message: "শাসনকার্য পর্যালোচনা অধিবেশন সফলভাবে সম্পন্ন ও রেজোলিউশন সংরক্ষিত হয়েছে।",
      });
    }

    // Schedule new review
    const { periodTitleBn, reviewDate, leadReviewerName, leadReviewerRole, participatingRoles, summaryDecisionsBn } = body;

    if (!periodTitleBn || !reviewDate) {
      return NextResponse.json(
        { success: false, error: "পর্যালোচনা পর্বের শিরোনাম এবং তারিখ আবশ্যক।" },
        { status: 400 }
      );
    }

    const scheduled = GovernanceReviewEngine.scheduleReview(
      {
        periodTitleBn,
        reviewDate,
        leadReviewerName,
        leadReviewerRole,
        participatingRoles,
        summaryDecisionsBn,
      },
      actor
    );

    // Sync to Phase 33 Calendar
    const calSync = await GovernanceReviewEngine.syncReviewToCalendar(scheduled.id);

    return NextResponse.json({
      success: true,
      review: scheduled,
      calendarSync: calSync,
      message: "শাসনকার্য পর্যালোচনা অধিবেশন নির্ধারিত হয়েছে এবং প্রাতিষ্ঠানিক ক্যালেন্ডারে যুক্ত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to handle review request." },
      { status: 500 }
    );
  }
}
