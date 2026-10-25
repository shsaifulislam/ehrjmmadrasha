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
    const vendorId = searchParams.get("vendorId");

    let quotations = ProcurementStore.getQuotations();

    if (rfqId) {
      quotations = quotations.filter((q) => q.rfqId === rfqId);
    }
    if (vendorId) {
      quotations = quotations.filter((q) => q.vendorId === vendorId);
    }

    return NextResponse.json({
      success: true,
      total: quotations.length,
      quotations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list quotations." },
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

    if (!body.rfqId || !body.vendorId || !body.items || body.items.length === 0 || !body.validUntilDate) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে RFQ আইডি, ভেন্ডর, মেয়াদ এবং আইটেম তালিকা প্রদান করুন।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const quotation = RfqQuotationEngine.submitQuotation(body, actor);

    return NextResponse.json({
      success: true,
      quotation,
      message: `কোটেশন সফলভাবে দাখিল করা হয়েছে (সংস্করণ: v${quotation.versionNumber})।`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit quotation." },
      { status: 500 }
    );
  }
}
