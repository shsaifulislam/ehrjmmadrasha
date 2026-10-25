import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { RfqQuotationEngine, ActorContext } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function POST(
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
    const body = await req.json();

    const approver: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const result = RfqQuotationEngine.approveAward(
      id,
      body.decisionNotes || "কার্যাদেশ চূড়ান্তভাবে অনুমোদিত।",
      approver
    );

    return NextResponse.json({
      success: true,
      evaluation: result.evaluation,
      rfq: result.rfq,
      quotation: result.quotation,
      message: `কার্যাদেশ চূড়ান্তভাবে অনুমোদিত হয়েছে এবং নির্বাচিত ভেন্ডরকে কার্যাদেশ প্রদান করা হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve evaluation award." },
      { status: 500 }
    );
  }
}
