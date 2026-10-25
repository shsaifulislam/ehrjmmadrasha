import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { RfqQuotationEngine } from "@/lib/procurement";

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

    const { searchParams } = new URL(req.url);
    const rfqId = searchParams.get("rfqId");

    if (!rfqId) {
      return NextResponse.json(
        { success: false, error: "RFQ আইডি প্রদান আবশ্যক।" },
        { status: 400 }
      );
    }

    const matrix = RfqQuotationEngine.generateComparisonMatrix(rfqId);

    return NextResponse.json({
      success: true,
      matrix,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate comparison matrix." },
      { status: 500 }
    );
  }
}
