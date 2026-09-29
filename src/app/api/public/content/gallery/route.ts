import { NextResponse } from "next/server";
import { getCmsGallery } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Only return gallery items that are public, approved, AND consent-verified
    const items = getCmsGallery(true);
    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("Public Gallery API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load gallery items" },
      { status: 500 }
    );
  }
}
