import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  VendorMasterEngine,
  ActorContext,
  VerificationStatus,
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
      verificationStatus: vendor.verificationStatus,
      verifications: vendor.verifications || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get vendor verification." },
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
    const { verificationId, status, notes } = body;

    if (!verificationId || !status) {
      return NextResponse.json(
        { success: false, error: "verificationId এবং status আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const verificationStatus = status === "REJECTED" ? "REJECTED" : "VERIFIED";

    const updatedVendor = VendorMasterEngine.recordVerification(
      id,
      verificationId,
      verificationStatus,
      notes || "",
      actor
    );

    return NextResponse.json({
      success: true,
      vendor: updatedVendor,
      verificationStatus: updatedVendor.verificationStatus,
      verifications: updatedVendor.verifications,
      message: "ভেন্ডর সত্যতা যাচাইকরণ সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record verification." },
      { status: 500 }
    );
  }
}
