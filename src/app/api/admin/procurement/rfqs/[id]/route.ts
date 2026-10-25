import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  RfqQuotationEngine,
  ActorContext,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const rfq = ProcurementStore.getRFQById(id);

    if (!rfq) {
      return NextResponse.json(
        { success: false, error: "RFQ বিজ্ঞপ্তি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const quotations = ProcurementStore.getQuotationsByRFQ(id);
    const evaluation = ProcurementStore.getEvaluationByRFQ(id);
    let comparisonMatrix = null;

    if (quotations.length > 0) {
      comparisonMatrix = RfqQuotationEngine.generateComparisonMatrix(id);
    }

    return NextResponse.json({
      success: true,
      rfq,
      quotations,
      evaluation,
      comparisonMatrix,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get RFQ details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const rfq = ProcurementStore.getRFQById(id);

    if (!rfq) {
      return NextResponse.json(
        { success: false, error: "RFQ বিজ্ঞপ্তি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    if (body.action === "TRANSITION_STATUS") {
      if (!body.targetStatus) {
        return NextResponse.json(
          { success: false, error: "টার্গেট স্ট্যাটাস আবশ্যক।" },
          { status: 400 }
        );
      }
      const updated = RfqQuotationEngine.transitionRfqStatus(
        id,
        body.targetStatus,
        body.notes || "",
        actor
      );
      return NextResponse.json({
        success: true,
        rfq: updated,
        message: "RFQ স্ট্যাটাস সফলভাবে পরিবর্তন করা হয়েছে।",
      });
    }

    if (body.invitedVendorIds) {
      rfq.invitedVendorIds = body.invitedVendorIds;
      rfq.updatedAt = new Date().toISOString();
      ProcurementStore.saveRFQ(rfq, actor);
    }

    return NextResponse.json({
      success: true,
      rfq,
      message: "RFQ হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update RFQ." },
      { status: 500 }
    );
  }
}
