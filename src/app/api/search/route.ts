import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { executeInstitutionalSearch } from "@/lib/knowledge/knowledgeEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const studentId = searchParams.get("studentId") || undefined;

    const sessionUser = await getSessionUser();
    const userRole = (sessionUser?.role as any) || "PUBLIC";

    const results = await executeInstitutionalSearch({
      query: q,
      category,
      user: {
        userId: sessionUser?.userId,
        role: userRole,
        studentId,
      },
      limit,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (err: any) {
    console.error("Search API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অনুসন্ধান ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, category, limit, studentId } = body;

    const sessionUser = await getSessionUser();
    const userRole = (sessionUser?.role as any) || "PUBLIC";

    const results = await executeInstitutionalSearch({
      query: query || "",
      category,
      user: {
        userId: sessionUser?.userId,
        role: userRole,
        studentId,
      },
      limit: limit || 10,
    });

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (err: any) {
    console.error("Search API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অনুসন্ধান ব্যর্থ হয়েছে।" },
      { status: 500 }
    );
  }
}
