import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { submitTransportRequest } from "@/lib/transportEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, routeId, pickupStopId, dropStopId, preferredStartDate, guardianNotes } = body;

    if (!studentId || !routeId || !pickupStopId) {
      return NextResponse.json(
        { error: "শিক্ষার্থী, রুট এবং পিকআপ স্টপ নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    const result = await submitTransportRequest({
      studentId,
      guardianUserId: user.userId,
      routeId,
      pickupStopId,
      dropStopId,
      preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : new Date(),
      reason: guardianNotes,
    });

    return NextResponse.json({
      success: true,
      message: "পরিবহন সেবার আবেদন সফলভাবে জমা দেওয়া হয়েছে।",
      request: result,
    });
  } catch (error: any) {
    console.error("Submit transport request error:", error);
    return NextResponse.json(
      { error: error.message || "আবেদন প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।" },
      { status: 500 }
    );
  }
}
