import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  ActorContext,
} from "@/lib/riskAssurance";

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
    const control = RiskAssuranceStore.getControlById(id);

    if (!control) {
      return NextResponse.json(
        { success: false, error: "নিয়ন্ত্রণ রেকর্ড পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const testRecords = RiskAssuranceStore.getControlTests().filter((t) => t.controlId === control.id);
    const exceptions = RiskAssuranceStore.getExceptions().filter((e) => e.controlId === control.id);
    const mappedRisks = RiskAssuranceStore.getRisks().filter(
      (r) => r.existingControlIds.includes(control.id) || control.relatedRiskIds.includes(r.id)
    );

    return NextResponse.json({
      success: true,
      control,
      testRecords,
      exceptions,
      mappedRisks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get control details." },
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
    const control = RiskAssuranceStore.getControlById(id);

    if (!control) {
      return NextResponse.json(
        { success: false, error: "নিয়ন্ত্রণ রেকর্ড পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const allowed = [
      "nameBn",
      "nameEn",
      "descriptionBn",
      "controlObjectiveBn",
      "ownerName",
      "ownerRole",
      "status",
      "frequency",
      "testingMethodBn",
      "nextTestDueDate",
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        (control as any)[key] = body[key];
      }
    }

    control.updatedBy = actor.actorId;
    control.updatedAt = new Date().toISOString();
    RiskAssuranceStore.saveControl(control, actor);

    return NextResponse.json({
      success: true,
      control,
      message: "নিয়ন্ত্রণ বিবরণ সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update control." },
      { status: 500 }
    );
  }
}
