import { NextRequest, NextResponse } from "next/server";
import { getAdmissionSessionConfig, updateAdmissionSessionConfig } from "@/lib/admissions/admissionConfigEngine";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admissions/config
 * Public endpoint to fetch active admission configuration, dates, class quotas, and availability.
 */
export async function GET(req: NextRequest) {
  try {
    const config = await getAdmissionSessionConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error("GET /api/admissions/config error:", error);
    return NextResponse.json(
      { error: "ভর্তি সেশন কনফিগারেশন লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admissions/config
 * Admin endpoint to update session settings, dates, and class availability.
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন কনফিগারেশন পরিবর্তন করতে পারেন।" },
        { status: 403 }
      );
    }

    const updates = await req.json();
    const updatedConfig = await updateAdmissionSessionConfig(updates, user.userId);

    return NextResponse.json({
      success: true,
      message: "ভর্তি কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।",
      config: updatedConfig,
    });
  } catch (error: any) {
    console.error("PUT /api/admissions/config error:", error);
    return NextResponse.json(
      { error: error.message || "ভর্তি কনফিগারেশন সংরক্ষণে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
