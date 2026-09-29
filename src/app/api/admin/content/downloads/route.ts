import { NextRequest, NextResponse } from "next/server";
import { getCmsDownloads, saveCmsDownload } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const downloads = getCmsDownloads(false);
    return NextResponse.json({ success: true, downloads });
  } catch (error) {
    console.error("Admin Downloads GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch downloads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = saveCmsDownload(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "ডাউনলোড নথি সফলভাবে সংরক্ষিত হয়েছে।",
      item,
    });
  } catch (error: any) {
    console.error("Admin Downloads POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save download item" }, { status: 500 });
  }
}
