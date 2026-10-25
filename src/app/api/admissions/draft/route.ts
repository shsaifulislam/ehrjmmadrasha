import { NextRequest, NextResponse } from "next/server";
import { saveDraftApplication, resumeDraftApplication } from "@/lib/admissions/draftApplicationEngine";

import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admissions/draft
 * Save or update an in-progress admission application as a draft.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "ড্রাফট সংরক্ষণের জন্য অভিভাবক অ্যাকাউন্টে লগইন আবশ্যক।", requiresAuth: true },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = await saveDraftApplication(body);

    return NextResponse.json({
      success: true,
      message: "ড্রাফট সফলভাবে সংরক্ষিত হয়েছে।",
      draftId: result.draftId,
      resumeToken: result.resumeToken,
      progressPercentage: result.progressPercentage,
      missingFields: result.missingFields,
      missingDocuments: result.missingDocuments,
      draft: result.draft,
    });
  } catch (error: any) {
    console.error("POST /api/admissions/draft error:", error);
    return NextResponse.json(
      { error: error.message || "ড্রাফট সংরক্ষণে সমস্যা হয়েছে।" },
      { status: 400 }
    );
  }
}

/**
 * GET /api/admissions/draft
 * Resume draft using draftId, resumeToken, or phone.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get("draftId");
    const resumeToken = searchParams.get("token") || searchParams.get("resumeToken");
    const phone = searchParams.get("phone");

    if (!draftId && !resumeToken && !phone) {
      return NextResponse.json(
        { error: "ড্রাফট আইডি, রিজিউম টোকেন অথবা মোবাইল নম্বর প্রদান করুন।" },
        { status: 400 }
      );
    }

    const identifier = (draftId || phone || "").trim();
    const token = (resumeToken || "").trim();

    const resumeResult = resumeDraftApplication(identifier, token);

    if (!resumeResult.success || !resumeResult.draft) {
      return NextResponse.json(
        { error: resumeResult.error || "মেয়াদোত্তীর্ণ বা অমিল ড্রাফট। কোনো খসড়া আবেদন পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      draft: resumeResult.draft,
    });
  } catch (error: any) {
    console.error("GET /api/admissions/draft error:", error);
    return NextResponse.json(
      { error: error.message || "ড্রাফট লোড করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
