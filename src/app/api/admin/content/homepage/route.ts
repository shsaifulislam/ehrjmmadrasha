import { NextRequest, NextResponse } from "next/server";
import { getHomepageConfig, saveHomepageConfig } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getHomepageConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error("Admin Homepage GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch homepage config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = saveHomepageConfig(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "হোমপেজ সেকশন কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে।",
      config: updated,
    });
  } catch (error) {
    console.error("Admin Homepage POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update homepage config" }, { status: 500 });
  }
}
