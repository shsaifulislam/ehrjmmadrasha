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

    return NextResponse.json({
      success: true,
      vendorId: vendor.id,
      legalNameBn: vendor.legalNameBn,
      documents: vendor.documents || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get vendor documents." },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await req.json();
    const { documentType, title, fileToken, expiryDate, documentUrl, notes } = body;

    if (!documentType || !title) {
      return NextResponse.json(
        { success: false, error: "দলিলের ধরণ (documentType) এবং শিরোনাম (title) আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const updatedVendor = VendorMasterEngine.attachDocumentReference(
      id,
      {
        documentType,
        title,
        phase29DocToken: fileToken || `DOC-VEN-${Date.now().toString().slice(-6)}`,
        expiryDate,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      vendor: updatedVendor,
      documents: updatedVendor.documents,
      message: "ভেন্ডর সংক্রান্ত দলিল রেফারেন্স সফলভাবে সংযুক্ত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to attach vendor document." },
      { status: 500 }
    );
  }
}
