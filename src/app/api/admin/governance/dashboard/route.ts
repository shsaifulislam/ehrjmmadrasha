import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  ControlRegisterEngine,
  GovernanceCrossModuleBridge,
} from "@/lib/riskAssurance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার: শুধুমাত্র অ্যাডমিন ও অধ্যক্ষের জন্য সংরক্ষিত।" },
        { status: 403 }
      );
    }

    const stats = RiskAssuranceStore.getDashboardStats();
    const gapAnalysis = ControlRegisterEngine.performControlGapAnalysis();
    const crossModuleProbes = await GovernanceCrossModuleBridge.getCrossModuleAssuranceSnapshot();
    const recentAudit = RiskAssuranceStore.getAuditLogs().slice(0, 10);
    const expiredExceptions = ControlRegisterEngine.scanExpiredExceptions();

    // 5x5 Heatmap Distribution Calculation (Likelihood x Impact)
    const risks = RiskAssuranceStore.getRisks();
    const matrixDistribution: Record<string, { count: number; riskIds: string[] }> = {};

    for (let l = 1; l <= 5; l++) {
      for (let i = 1; i <= 5; i++) {
        matrixDistribution[`${l}_${i}`] = { count: 0, riskIds: [] };
      }
    }

    for (const r of risks) {
      if (r.status !== "CLOSED" && r.status !== "ARCHIVED") {
        const key = `${r.residualLikelihood}_${r.residualImpact}`;
        if (matrixDistribution[key]) {
          matrixDistribution[key].count += 1;
          matrixDistribution[key].riskIds.push(r.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      checkpoint: "EHRJ-AI-2026-PHASE42",
      institutionHeader: {
        nameBn: "ইলিয়টগঞ্জ হাজী রহমাতুল্লাহ্ জমিরীয়া মাদরাসা",
        nameEn: "Eliotganj Hazi Rohmatollah Jamiria Madrasha",
        subtitleBn: "প্রাতিষ্ঠানিক ঝুঁকি ব্যবস্থাপনা, অভ্যন্তরীণ নিয়ন্ত্রণ ও সুশাসন নিশ্চয়তা ককপিট",
      },
      stats,
      gapAnalysis,
      matrixDistribution,
      crossModuleProbes,
      expiredExceptionsAlert: expiredExceptions,
      recentAudit,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load governance dashboard." },
      { status: 500 }
    );
  }
}
