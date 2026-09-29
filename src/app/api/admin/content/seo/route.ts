import { NextRequest, NextResponse } from "next/server";
import { getSeoConfig, saveSeoConfig } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const seo = getSeoConfig();
    return NextResponse.json({ success: true, seo });
  } catch (error) {
    console.error("Admin SEO GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch SEO config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = saveSeoConfig(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "SEO কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে।",
      seo: updated,
    });
  } catch (error) {
    console.error("Admin SEO POST Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update SEO config" }, { status: 500 });
  }
}
