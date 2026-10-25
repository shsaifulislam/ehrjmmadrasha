import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RequirementRegisterEngine,
  RequirementCategory,
  RequirementSource,
  ComplianceScope,
  RequirementStatus,
  ActorContext,
} from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as RequirementCategory | null;
    const source = searchParams.get("source") as RequirementSource | null;
    const scope = searchParams.get("scope") as ComplianceScope | null;
    const status = searchParams.get("status") as RequirementStatus | null;
    const isApplicableParam = searchParams.get("isApplicable");
    const search = searchParams.get("search") || undefined;

    let isApplicable: boolean | undefined = undefined;
    if (isApplicableParam === "true") isApplicable = true;
    if (isApplicableParam === "false") isApplicable = false;

    const list = RequirementRegisterEngine.getFilteredRequirements({
      category: category || undefined,
      source: source || undefined,
      scope: scope || undefined,
      status: status || undefined,
      isApplicable,
      search,
    });

    return NextResponse.json({
      success: true,
      data: list,
      count: list.length,
    });
  } catch (err: any) {
    console.error("[API Requirements GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "অ্যাডমিনিস্ট্রেটর",
      userRole: user.role,
    };

    const newReq = RequirementRegisterEngine.createRequirement(body, actor);

    return NextResponse.json({
      success: true,
      data: newReq,
      message: "নতুন কমপ্লায়েন্স প্রয়োজনীয়তা সফলভাবে নিবন্ধিত হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Requirements POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "সংরক্ষণে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
