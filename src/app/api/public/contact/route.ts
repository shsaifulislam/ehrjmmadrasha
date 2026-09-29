import { NextRequest, NextResponse } from "next/server";
import { processPublicContactSubmission } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const result = await processPublicContactSubmission(payload, ip);

    if (!result.success) {
      const status = result.errorCode === "RATE_LIMITED" ? 429 : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Public Contact API Error:", error);
    return NextResponse.json(
      { success: false, messageBn: "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি ফোন করুন।" },
      { status: 500 }
    );
  }
}
