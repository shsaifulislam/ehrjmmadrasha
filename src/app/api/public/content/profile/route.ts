import { NextResponse } from "next/server";
import { getInstitutionalProfile } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = getInstitutionalProfile();
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Public Profile API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load institutional profile" },
      { status: 500 }
    );
  }
}
