import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
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
    const contracts = ProcurementStore.getContracts().filter((c) => c.vendorId === id);
    const risks = ProcurementStore.getRisks().filter((r) => r.vendorId === id);

    const scorecard = {
      vendorId: vendor.id,
      vendorName: vendor.legalNameBn,
      vendorType: vendor.vendorType,
      categoryCode: vendor.categoryCode,
      status: vendor.status,
      riskLevel: vendor.riskLevel,
      ratingSummary: vendor.ratingSummary,
      activeContractsCount: contracts.filter((c) => c.status === "ACTIVE").length,
      totalContractsValueBdt: contracts.reduce((sum, c) => sum + c.totalContractValue, 0),
      totalReviewsCount: reviews.length,
      recentReviews: reviews.slice(-3),
      activeRisksCount: risks.filter((r) => !r.isMitigated).length,
      risks,
    };

    return NextResponse.json({
      success: true,
      scorecard,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get vendor performance." },
      { status: 500 }
    );
  }
}
