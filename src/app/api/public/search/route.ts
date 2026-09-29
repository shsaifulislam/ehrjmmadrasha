import { NextRequest, NextResponse } from "next/server";
import { executePublicSearch } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const searchResult = await executePublicSearch(q);

    return NextResponse.json({
      success: true,
      ...searchResult,
    });
  } catch (error) {
    console.error("Public Search API Error:", error);
    return NextResponse.json(
      { success: false, error: "Public search failed", results: [], count: 0 },
      { status: 500 }
    );
  }
}
