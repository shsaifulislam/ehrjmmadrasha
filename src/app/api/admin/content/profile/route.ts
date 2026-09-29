import { NextRequest, NextResponse } from "next/server";
import { getInstitutionalProfile, saveInstitutionalProfile } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = getInstitutionalProfile();
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Admin Profile GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = saveInstitutionalProfile(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "প্রাতিষ্ঠানিক প্রোফাইল সফলভাবে হালনাগাদ করা হয়েছে।",
      profile: updated,
    });
  } catch (error) {
    console.error("Admin Profile POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
