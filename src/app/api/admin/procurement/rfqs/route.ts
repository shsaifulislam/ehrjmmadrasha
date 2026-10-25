import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ProcurementStore, RfqQuotationEngine, ActorContext, RFQStatus } from "@/lib/procurement";

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
    const status = (searchParams.get("status") as RFQStatus) || undefined;
    const query = searchParams.get("query")?.toLowerCase().trim();

    let rfqs = ProcurementStore.getRFQs();

    if (status) {
      rfqs = rfqs.filter((r) => r.status === status);
    }

    if (query) {
      rfqs = rfqs.filter(
        (r) =>
          r.titleBn.toLowerCase().includes(query) ||
          r.titleEn.toLowerCase().includes(query) ||
          r.rfqCode.toLowerCase().includes(query) ||
          r.categoryCode.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      total: rfqs.length,
      rfqs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list RFQs." },
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

    if (!body.titleBn || !body.descriptionBn || !body.categoryCode || !body.submissionDeadline || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে RFQ শিরোনাম, বিবরণ, ক্যাটাগরি, শেষ সময় ও পণ্যের তালিকা প্রদান করুন।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const rfq = RfqQuotationEngine.createRFQ(body, actor);

    return NextResponse.json({
      success: true,
      rfq,
      message: "RFQ কোটেশন বিজ্ঞপ্তি সফলভাবে প্রস্তুত করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create RFQ." },
      { status: 500 }
    );
  }
}
