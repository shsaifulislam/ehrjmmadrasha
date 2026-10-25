import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ProcurementStore, RfqQuotationEngine, ActorContext } from "@/lib/procurement";

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

    let evals = ProcurementStore.getEvaluations();
    if (rfqId) {
      evals = evals.filter((e) => e.rfqId === rfqId);
    }

    return NextResponse.json({
      success: true,
      total: evals.length,
      evaluations: evals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list evaluations." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.rfqId || !body.recommendedVendorId || !body.recommendedQuotationId || !body.recommendationJustificationBn) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে RFQ, প্রস্তাবিত ভেন্ডর, কোটেশন এবং সুপারিশের যৌক্তিকতা উল্লেখ করুন।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const evaluation = RfqQuotationEngine.recordEvaluation(body, actor);

    return NextResponse.json({
      success: true,
      evaluation,
      message: "প্রকিউরমেন্ট মূল্যায়ন ও সুপারিশ নথিভুক্ত হয়েছে (চূড়ান্ত অনুমোদনের অপেক্ষায়)।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record evaluation." },
      { status: 500 }
    );
  }
}
