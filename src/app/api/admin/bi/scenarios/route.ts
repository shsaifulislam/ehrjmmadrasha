import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { runScenarioSimulation, ScenarioParams } from "@/lib/scenarioEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const scenarioType = body.type || "BASE";

    let params: ScenarioParams;
    if (scenarioType === "CONSERVATIVE") {
      params = {
        type: "CONSERVATIVE",
        collectionDeltaPct: -15,
        expenseDeltaPct: 5,
        enrollmentDeltaPct: -2,
        horizonMonths: Number(body.horizonMonths) || 6
      };
    } else if (scenarioType === "STRESS") {
      params = {
        type: "STRESS",
        collectionDeltaPct: -30,
        expenseDeltaPct: 15,
        enrollmentDeltaPct: -10,
        horizonMonths: Number(body.horizonMonths) || 6
      };
    } else if (scenarioType === "CUSTOM") {
      params = {
        type: "CUSTOM",
        collectionDeltaPct: Number(body.collectionDeltaPct) || 0,
        expenseDeltaPct: Number(body.expenseDeltaPct) || 0,
        enrollmentDeltaPct: Number(body.enrollmentDeltaPct) || 0,
        horizonMonths: Number(body.horizonMonths) || 6,
        customTitleBn: body.customTitleBn || "কাস্টম সিমুলেশন সিনারিও"
      };
    } else {
      params = {
        type: "BASE",
        collectionDeltaPct: 0,
        expenseDeltaPct: 0,
        enrollmentDeltaPct: 0,
        horizonMonths: Number(body.horizonMonths) || 6
      };
    }

    const result = await runScenarioSimulation(params);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" }, { status: 500 });
  }
}
