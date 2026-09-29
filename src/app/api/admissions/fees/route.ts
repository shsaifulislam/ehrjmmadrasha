import { NextRequest, NextResponse } from "next/server";
import { calculateAdmissionFee } from "@/lib/admissions/admissionFeeEngine";

export const dynamic = "force-dynamic";

/**
 * GET /api/admissions/fees
 * Calculate transparent fee breakdown dynamically based on class, session, residential status, and assistance profile.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sessionId = searchParams.get("sessionId") || undefined;
    const residentialStatus = (searchParams.get("residentialStatus") as any) || "NON_RESIDENTIAL";
    const isOrphan = searchParams.get("isOrphan") === "true";
    const isFinanciallyWeak = searchParams.get("isFinanciallyWeak") === "true";
    const financialAssistanceRequested = searchParams.get("financialAssistanceRequested") === "true";

    if (!classId) {
      return NextResponse.json(
        { error: "ক্লাস আইডি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const feeBreakdown = await calculateAdmissionFee({
      classId,
      sessionId,
      residentialStatus,
      isOrphan,
      isFinanciallyWeak,
      financialAssistanceRequested,
    });

    return NextResponse.json({
      success: true,
      feeBreakdown,
    });
  } catch (error: any) {
    console.error("GET /api/admissions/fees error:", error);
    return NextResponse.json(
      { error: error.message || "ফি বিবরণী হিসাব করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
