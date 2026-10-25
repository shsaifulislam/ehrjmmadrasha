import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { RequirementRegisterEngine, ActorContext } from "@/lib/compliance";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const reqItem = RequirementRegisterEngine.getRequirementById(id);
    if (!reqItem) {
      return NextResponse.json(
        { success: false, error: "প্রয়োজনীয়তা পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: reqItem });
  } catch (err: any) {
    console.error("[API Requirement GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "অ্যাডমিনিস্ট্রেটর",
      userRole: user.role,
    };

    if (body.action === "UPDATE_APPLICABILITY") {
      const updated = RequirementRegisterEngine.updateApplicability(
        id,
        Boolean(body.isApplicable),
        {
          reason: body.reason,
          reviewer: body.reviewer || user.email || "প্রধান মহোদয়",
          evidenceRef: body.evidenceRef,
        },
        actor
      );
      return NextResponse.json({
        success: true,
        data: updated,
        message: "প্রযোজ্যতা সফলভাবে হালনাগাদ করা হয়েছে।",
      });
    }

    const updated = RequirementRegisterEngine.updateRequirement(
      id,
      body.updates || body,
      actor,
      Boolean(body.isMajorChange)
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: "প্রয়োজনীয়তা সফলভাবে হালনাগাদ হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Requirement PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "হালনাগাদ ব্যর্থ।" },
      { status: 400 }
    );
  }
}
