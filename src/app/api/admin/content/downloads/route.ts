import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getCmsDownloads, saveCmsDownload } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const downloads = getCmsDownloads(false);
    return NextResponse.json({ success: true, downloads });
  } catch (error) {
    console.error("Admin Downloads GET Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch downloads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const item = saveCmsDownload(body, "ADMIN");
    return NextResponse.json({
      success: true,
      messageBn: "ডাউনলোড নথি সফলভাবে সংরক্ষিত হয়েছে।",
      item,
    });
  } catch (error: any) {
    console.error("Admin Downloads POST Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to save download" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Download ID is required" }, { status: 400 });
    }

    const { deleteCmsDownload } = await import("@/lib/cms");
    const deleted = deleteCmsDownload(id, "ADMIN");
    return NextResponse.json({
      success: deleted,
      messageBn: deleted ? "ডাউনলোড ফাইল সফলভাবে মুছে ফেলা হয়েছে।" : "ফাইল খুঁজে পাওয়া যায়নি।",
    });
  } catch (error: any) {
    console.error("Admin Downloads DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete download item" }, { status: 500 });
  }
}
