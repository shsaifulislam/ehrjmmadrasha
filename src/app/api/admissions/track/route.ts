import { NextRequest, NextResponse } from "next/server";
import { getSecureTrackingDetails } from "@/lib/admissions/trackingSecurity";
import { handleTracking } from "@/lib/admissionTrack";

export const dynamic = "force-dynamic";

/**
 * GET /api/admissions/track
 * Secure tracking lookup. Supports Phase 3 legacy query (phone / trackingId)
 * or Phase 34 enhanced tracking with phone verification, timeline, masked PII,
 * document checklist, and post-enrollment onboarding checklist.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trackingId = searchParams.get("trackingId")?.trim() || searchParams.get("appId")?.trim();
    const phone = searchParams.get("phone")?.trim();
    const enhanced = searchParams.get("enhanced") === "true";

    if (!trackingId && !phone) {
      return NextResponse.json(
        { error: "অনুগ্রহ করে আবেদন ট্র্যাকিং আইডি (EHRJ-ADM-YYYY-XXXX) অথবা মোবাইল নম্বর প্রদান করুন।" },
        { status: 400 }
      );
    }

    // If enhanced tracking requested, run Phase 34 secure tracking with timeline & masking
    if (enhanced || (trackingId && phone)) {
      const trackingResult = await getSecureTrackingDetails({
        trackingId: trackingId || "",
        verificationPhone: phone,
      });

      if (!trackingResult) {
        return NextResponse.json(
          { error: "প্রদত্ত ট্র্যাকিং নম্বর বা মোবাইল নম্বরের তথ্যে মিল পাওয়া যায়নি।" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        tracking: trackingResult,
      });
    }

    // Default to Phase 3 backward-compatible tracking handler
    const query = trackingId || phone || "";
    return await handleTracking(query);
  } catch (error: any) {
    console.error("Admission Tracking Error:", error);
    return NextResponse.json(
      { error: "ট্র্যাকিং তথ্য সংগ্রহে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admissions/track
 * Secure tracking POST endpoint with body parameters.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trackingId, phone } = body;

    if (!trackingId) {
      return NextResponse.json(
        { error: "ট্র্যাকিং আইডি প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    const trackingResult = await getSecureTrackingDetails({
      trackingId: trackingId.trim(),
      verificationPhone: phone?.trim(),
    });

    if (!trackingResult) {
      return NextResponse.json(
        { error: "প্রদত্ত ট্র্যাকিং নম্বর বা মোবাইল নম্বরের তথ্যে মিল পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tracking: trackingResult,
    });
  } catch (error: any) {
    console.error("POST Admission Tracking Error:", error);
    return NextResponse.json(
      { error: "ট্র্যাকিং তথ্য সংগ্রহে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
