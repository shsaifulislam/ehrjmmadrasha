import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { VendorMasterEngine, VendorCategoryCode, VendorStatus, VendorType, ActorContext } from "@/lib/procurement";

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
    const query = searchParams.get("query") || undefined;
    const category = (searchParams.get("category") as VendorCategoryCode) || undefined;
    const status = (searchParams.get("status") as VendorStatus) || undefined;
    const type = (searchParams.get("type") as VendorType) || undefined;

    const vendors = VendorMasterEngine.listVendors({
      query,
      category,
      status,
      type,
    });

    return NextResponse.json({
      success: true,
      total: vendors.length,
      vendors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list vendors." },
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

    if (!body.legalNameBn || !body.phone || !body.addressBn || !body.categoryCode || !body.vendorType) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে সকল আবশ্যক তথ্য (নাম, ফোন, ঠিকানা, ক্যাটাগরি, ধরণ) সঠিকভাবে পূরণ করুন।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const result = VendorMasterEngine.createVendor(body, actor);

    return NextResponse.json({
      success: true,
      vendor: result.vendor,
      duplicateWarnings: result.duplicateWarnings,
      message: result.duplicateWarnings.length > 0
        ? "ভেন্ডর নিবন্ধিত হয়েছে (সম্ভাব্য ডুপ্লিকেট সতর্কতা লক্ষ্য করুন)"
        : "ভেন্ডর সফলভাবে নিবন্ধিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vendor." },
      { status: 500 }
    );
  }
}
