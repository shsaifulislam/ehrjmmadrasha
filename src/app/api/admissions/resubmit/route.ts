import { NextRequest, NextResponse } from "next/server";
import { resubmitCorrectedApplication } from "@/lib/admissions/correctionWorkflowEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/admissions/resubmit
 * Allows an applicant with status CORRECTION_REQUESTED to resubmit corrected data/documents.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, trackingId, guardianPhone, correctedFields, correctedDocuments, applicantNotes } = body;

    if (!applicationId && !trackingId) {
      return NextResponse.json(
        { error: "আবেদন আইডি বা ট্র্যাকিং নম্বর প্রদান করা আবশ্যক।" },
        { status: 400 }
      );
    }

    if (!guardianPhone) {
      return NextResponse.json(
        { error: "নিরাপত্তা নিশ্চিতকরণের জন্য আবেদনের অভিভাবকের মোবাইল নম্বর প্রদান করুন।" },
        { status: 400 }
      );
    }

    const result = await resubmitCorrectedApplication({
      applicationId,
      trackingId,
      guardianPhone,
      correctedFields,
      correctedDocuments,
      applicantNotes,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      trackingId: result.trackingId,
      status: result.status,
    });
  } catch (error: any) {
    console.error("POST /api/admissions/resubmit error:", error);
    return NextResponse.json(
      { error: error.message || "সংশোধিত আবেদন জমা করতে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}
