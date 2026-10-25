import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  RfqQuotationEngine,
  ActorContext,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rfqId = searchParams.get("rfqId");

    const evaluations = ProcurementStore.getEvaluations();
    const filtered = rfqId
      ? evaluations.filter((e) => e.rfqId === rfqId)
      : evaluations;

    return NextResponse.json({
      success: true,
      total: filtered.length,
      evaluations: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list procurement decisions." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "PRINCIPAL") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: শুধুমাত্র মুহতামিম/অধ্যক্ষ (Principal) চূড়ান্ত প্রকিউরমেন্ট অনুমোদন প্রদান করতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { evaluationId, finalRemarksBn } = body;

    if (!evaluationId) {
      return NextResponse.json(
        { success: false, error: "মূল্যায়ন আইডি (evaluationId) আবশ্যক।" },
        { status: 400 }
      );
    }

    const approver: ActorContext = {
      actorId: user.userId || "principal-01",
      actorName: user.name || "মুহতামিম সাহেব (অধ্যক্ষ)",
      actorRole: "PRINCIPAL",
    };

    const result = RfqQuotationEngine.awardProcurementDecision(
      evaluationId,
      finalRemarksBn || "যথাযথ প্রক্রিয়া ও তুলনামূলক বিশ্লেষণের পর কার্যাদেশ অনুমোদন করা হলো।",
      approver
    );

    return NextResponse.json({
      success: true,
      evaluation: result.evaluation,
      rfq: result.rfq,
      quotation: result.quotation,
      message: "প্রকিউরমেন্ট সিদ্ধান্ত চূড়ান্তভাবে অনুমোদিত হয়েছে এবং কার্যাদেশ প্রদান সম্পন্ন হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record procurement award decision." },
      { status: 500 }
    );
  }
}
