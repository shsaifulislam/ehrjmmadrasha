import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitResidentialRequest } from "@/lib/hostelEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal/hostel/request
 * Guardian submits a residential request (Admission, Status Change, Checkout)
 * Strict server-side verification: Guardian must be linked to the specified child.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, requestType, requestedStatus, targetStatus, reason, sessionId } = body;
    const finalRequestedStatus = requestedStatus || targetStatus;

    if (!studentId || !requestType || !finalRequestedStatus || !reason) {
      return NextResponse.json(
        { error: "আবশ্যকীয় তথ্যসমূহ (শিক্ষার্থী, আবেদনের ধরন, প্রত্যাশিত স্ট্যাটাস এবং কারণ) প্রদান করুন।" },
        { status: 400 }
      );
    }

    const request = await submitResidentialRequest({
      studentId,
      guardianUserId: user.userId,
      requestType,
      requestedStatus: finalRequestedStatus,
      reason,
      sessionId,
    });

    return NextResponse.json({
      success: true,
      message: `আবাসিক আবেদন সফলভাবে গৃহীত হয়েছে। ট্র্যাকিং নম্বর: ${request.requestNumber}`,
      request,
    });
  } catch (error: any) {
    console.error("POST /api/portal/hostel/request error:", error);
    const status = error.statusCode || 400;
    return NextResponse.json(
      { error: error.message || "আবেদন জমাদানে সমস্যা হয়েছে।" },
      { status }
    );
  }
}
