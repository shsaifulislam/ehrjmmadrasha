import { NextResponse } from "next/server";
import { getHomepageConfig } from "@/lib/cms";
import { isAdmissionCurrentlyOpen } from "@/lib/admissions/admissionConfigEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getHomepageConfig();
    const status = await isAdmissionCurrentlyOpen();

    return NextResponse.json({
      success: true,
      admissionState: status.isOpen ? "OPEN" : "CLOSED",
      announcementBn: status.isOpen
        ? config.admissionAnnouncementBn?.replace(
            /20\d{2}|২০[০-৯]{2}/g,
            status.config.sessionName
          ) ?? "ভর্তি কার্যক্রম চলছে। নির্ধারিত সময়সীমার মধ্যে আবেদন করুন।"
        : "বর্তমানে ভর্তি আবেদন গ্রহণ বন্ধ রয়েছে।",
      sessionName: status.isOpen ? status.config.sessionName : "শিক্ষাবর্ষ নির্ধারিত নয়",
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error("Admission Status API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load admission status" },
      { status: 500 }
    );
  }
}
