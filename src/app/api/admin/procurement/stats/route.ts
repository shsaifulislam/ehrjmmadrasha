import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  ContractEngine,
  ProcurementIntegrationBridge,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    // Refresh contract expiries
    const { expiringContracts, triggeredReminders } = ContractEngine.checkContractExpiries();

    const stats = ProcurementStore.getDashboardStats();
    const recentAudits = ProcurementStore.getAuditLogs().slice(0, 15);
    const pendingVendors = ProcurementStore.getVendors().filter(
      (v) => v.verificationStatus === "PENDING"
    );
    const eligiblePRs = await ProcurementIntegrationBridge.getEligiblePurchaseRequests();

    return NextResponse.json({
      success: true,
      stats,
      expiringContracts,
      triggeredReminders,
      pendingVendors,
      eligiblePRs,
      recentAudits,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch procurement stats." },
      { status: 500 }
    );
  }
}
