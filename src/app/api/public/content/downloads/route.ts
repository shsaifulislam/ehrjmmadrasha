import { NextResponse } from "next/server";
import { getCmsDownloads } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const downloads = getCmsDownloads(true);
    return NextResponse.json({
      success: true,
      downloads,
    });
  } catch (error) {
    console.error("Public Downloads API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load downloads" },
      { status: 500 }
    );
  }
}
