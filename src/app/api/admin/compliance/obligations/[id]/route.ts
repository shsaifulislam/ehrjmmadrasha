import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ComplianceStore,
  ObligationEngine,
  ComplianceCrossModuleBridge,
  ActorContext,
} from "@/lib/compliance";

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
    const obligation = ComplianceStore.getObligations().find((o) => o.id === id);
    if (!obligation) {
      return NextResponse.json(
        { success: false, error: "কমপ্লায়েন্স দায় পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const requirement = ComplianceStore.getRequirements().find(
      (r) => r.id === obligation.requirementId
    );
    const evidence = ComplianceStore.getEvidence().filter((e) => e.obligationId === id);
    const reviews = ComplianceStore.getReviews().filter((r) => r.obligationId === id);
    const exceptions = ComplianceStore.getExceptions().filter((e) => e.obligationId === id);
    const remediations = ComplianceStore.getRemediations().filter((rem) => rem.obligationId === id);

    return NextResponse.json({
      success: true,
      data: {
        obligation,
        requirement,
        evidence,
        reviews,
        exceptions,
        remediations,
      },
    });
  } catch (err: any) {
    console.error("[API Obligation GET] Error:", err);
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

    if (body.action === "ASSIGN_OWNER") {
      const updated = ObligationEngine.assignOwner(
        id,
        {
          ownerId: body.ownerId,
          ownerName: body.ownerName,
          ownerRole: body.ownerRole,
          backupOwnerId: body.backupOwnerId,
          backupOwnerName: body.backupOwnerName,
        },
        actor
      );
      return NextResponse.json({
        success: true,
        data: updated,
        message: "দায়িত্বপ্রাপ্ত কর্মকর্তা সফলভাবে পুনঃনির্ধারণ করা হয়েছে।",
      });
    }

    if (body.status) {
      const updated = ObligationEngine.updateObligationStatus(
        id,
        body.status,
        body.notes,
        actor
      );
      // Re-sync calendar status
      await ComplianceCrossModuleBridge.syncObligationToCalendar(id);

      return NextResponse.json({
        success: true,
        data: updated,
        message: "কমপ্লায়েন্স স্থিতি সফলভাবে হালনাগাদ করা হয়েছে।",
      });
    }

    return NextResponse.json(
      { success: false, error: "অবৈধ অ্যাকশন।" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[API Obligation PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "হালনাগাদ ব্যর্থ।" },
      { status: 400 }
    );
  }
}
