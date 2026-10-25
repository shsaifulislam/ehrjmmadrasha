import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  VendorMasterEngine,
  ActorContext,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const vendor = ProcurementStore.getVendorById(id);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "ভেন্ডর পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const contracts = ProcurementStore.getContracts().filter((c) => c.vendorId === id);
    const quotations = ProcurementStore.getQuotations().filter((q) => q.vendorId === id);
    const reviews = ProcurementStore.getReviews().filter((r) => r.vendorId === id);
    const risks = ProcurementStore.getRisks().filter((r) => r.vendorId === id);

    return NextResponse.json({
      success: true,
      vendor,
      contracts,
      quotations,
      reviews,
      risks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get vendor details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const vendor = ProcurementStore.getVendorById(id);

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "ভেন্ডর পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const body = await req.json();
    const { action } = body;

    let updatedVendor = vendor;

    if (action === "TRANSITION_STATUS") {
      if (!body.targetStatus || !body.reasonBn) {
        return NextResponse.json(
          { success: false, error: "টার্গেট স্ট্যাটাস এবং কারণ আবশ্যক।" },
          { status: 400 }
        );
      }
      updatedVendor = VendorMasterEngine.transitionVendorStatus(
        id,
        body.targetStatus,
        body.reasonBn,
        actor
      );
    } else if (action === "RECORD_VERIFICATION") {
      if (!body.verificationId || !body.status) {
        return NextResponse.json(
          { success: false, error: "যাচাইকরণ আইডি এবং স্ট্যাটাস আবশ্যক।" },
          { status: 400 }
        );
      }
      updatedVendor = VendorMasterEngine.recordVerification(
        id,
        body.verificationId,
        body.status,
        body.notes || "",
        actor
      );
    } else if (action === "UPSERT_CONTACT") {
      if (!body.contact || !body.contact.name || !body.contact.phone) {
        return NextResponse.json(
          { success: false, error: "যোগাযোগকারীর নাম ও ফোন নম্বর আবশ্যক।" },
          { status: 400 }
        );
      }
      updatedVendor = VendorMasterEngine.upsertContact(id, body.contact, actor);
    } else if (action === "ATTACH_DOCUMENT") {
      if (!body.document || !body.document.documentType || !body.document.title) {
        return NextResponse.json(
          { success: false, error: "দলিলের ধরণ ও শিরোনাম আবশ্যক।" },
          { status: 400 }
        );
      }
      updatedVendor = VendorMasterEngine.attachDocumentReference(id, body.document, actor);
    } else {
      // General update
      const allowed = [
        "legalNameBn",
        "legalNameEn",
        "displayName",
        "phone",
        "altPhone",
        "email",
        "addressBn",
        "district",
        "notes",
        "tradeLicenseNo",
        "tinNumber",
        "binVatNumber",
        "bankName",
        "bankBranch",
        "bankAccountTitle",
      ];
      for (const k of allowed) {
        if (body[k] !== undefined) {
          (vendor as any)[k] = body[k];
        }
      }
      if (body.bankAccountNumber) {
        vendor.bankAccountNumberMasked = VendorMasterEngine.maskBankAccountNumber(body.bankAccountNumber);
      }
      updatedVendor = ProcurementStore.saveVendor(vendor, actor);
    }

    return NextResponse.json({
      success: true,
      vendor: updatedVendor,
      message: "ভেন্ডর রেকর্ড সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vendor." },
      { status: 500 }
    );
  }
}
