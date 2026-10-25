import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  VendorPerformanceEngine,
  ActorContext,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const vendor = ProcurementStore.getVendorById(id);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "ভেন্ডর পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const reviews = ProcurementStore.getReviews().filter((r) => r.vendorId === id);

    return NextResponse.json({
      success: true,
      vendorId: vendor.id,
      legalNameBn: vendor.legalNameBn,
      totalReviews: reviews.length,
      reviews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get vendor reviews." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const vendor = ProcurementStore.getVendorById(id);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "ভেন্ডর পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const body = await req.json();

    if (!body.reviewPeriod || body.totalOrders === undefined || !body.factualSummaryBn) {
      return NextResponse.json(
        { success: false, error: "পর্যালোচনা সময়কাল (reviewPeriod), মোট অর্ডার (totalOrders) এবং বাস্তবিক বিবরণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const reviewer: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const review = VendorPerformanceEngine.recordPerformanceReview(
      {
        vendorId: id,
        reviewPeriod: body.reviewPeriod,
        totalOrders: Number(body.totalOrders) || 0,
        onTimeDeliveries: Number(body.onTimeDeliveries) || 0,
        delayedDeliveries: Number(body.delayedDeliveries) || 0,
        qualityPassedOrders: Number(body.qualityPassedOrders) || 0,
        qualityIssueOrders: Number(body.qualityIssueOrders) || 0,
        disputeCount: Number(body.disputeCount) || 0,
        averageResponseDays: Number(body.averageResponseDays) || 1,
        factualSummaryBn: body.factualSummaryBn,
        recommendedAction: body.recommendedAction || "CONTINUE",
      },
      reviewer
    );

    return NextResponse.json({
      success: true,
      review,
      message: "ভেন্ডর পারফরম্যান্স পর্যালোচনা সফলভাবে লিপিবদ্ধ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record vendor review." },
      { status: 500 }
    );
  }
}
