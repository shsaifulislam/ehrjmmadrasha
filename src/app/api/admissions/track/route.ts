import { NextRequest, NextResponse } from "next/server";
import { handleTracking } from "@/lib/admissionTrack";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get("trackingId")?.trim() || searchParams.get("appId")?.trim();
    const phone = searchParams.get("phone")?.trim();
    const query = trackingId || phone;

    if (!query) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে আবেদন ট্র্যাকিং আইডি (EHRJ-ADM-YYYY-XXXX) অথবা মোবাইল নম্বর প্রদান করুন।" },
        { status: 400 }
      );
    }

    return await handleTracking(query);
  } catch (error: any) {
    console.error("Admission Tracking Error:", error);
    return NextResponse.json(
      { error: "ট্র্যাকিং তথ্য সংগ্রহে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
