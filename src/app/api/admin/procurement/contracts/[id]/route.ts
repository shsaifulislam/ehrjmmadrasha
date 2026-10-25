import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  ContractEngine,
  ProcurementIntegrationBridge,
  ActorContext,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const contract = ProcurementStore.getContractById(id);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: "চুক্তিপত্র পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const threeWayMatch = await ProcurementIntegrationBridge.reconcileThreeWayMatch({
      contractId: contract.id,
      purchaseOrderId: contract.purchaseOrderId,
    });

    return NextResponse.json({
      success: true,
      contract,
      threeWayMatch,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get contract details." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const contract = ProcurementStore.getContractById(id);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: "চুক্তিপত্র পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    if (body.action === "TRANSITION_STATUS") {
      if (!body.targetStatus || !body.reasonBn) {
        return NextResponse.json(
          { success: false, error: "টার্গেট স্ট্যাটাস এবং কারণ আবশ্যক।" },
          { status: 400 }
        );
      }
      const updated = ContractEngine.transitionContractStatus(
        id,
        body.targetStatus,
        body.reasonBn,
        actor
      );
      return NextResponse.json({
        success: true,
        contract: updated,
        message: "চুক্তির স্ট্যাটাস সফলভাবে পরিবর্তন করা হয়েছে।",
      });
    }

    if (body.action === "REVISE_VERSION") {
      if (!body.changeReason) {
        return NextResponse.json(
          { success: false, error: "সংশোধনের কারণ উল্লেখ করা আবশ্যক।" },
          { status: 400 }
        );
      }
      const updated = ContractEngine.reviseContract(
        id,
        {
          changeReason: body.changeReason,
          newContractValue: body.newContractValue,
          newEndDate: body.newEndDate,
          newPaymentTermsBn: body.newPaymentTermsBn,
          newNotes: body.newNotes,
        },
        actor
      );
      return NextResponse.json({
        success: true,
        contract: updated,
        message: `চুক্তিপত্রের নতুন সংস্করণ (v${updated.currentVersion}) প্রস্তুত ও সংরক্ষিত হয়েছে।`,
      });
    }

    if (body.action === "COMPLETE_DELIVERABLE") {
      if (!body.deliverableId) {
        return NextResponse.json(
          { success: false, error: "ডেলিভারেবল আইডি আবশ্যক।" },
          { status: 400 }
        );
      }
      const updated = ContractEngine.markDeliverableComplete(
        id,
        body.deliverableId,
        actor
      );
      return NextResponse.json({
        success: true,
        contract: updated,
        message: "ডেলিভারেবল সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।",
      });
    }

    return NextResponse.json(
      { success: false, error: "অকার্যকর অপারেশন অ্যাকশন।" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update contract." },
      { status: 500 }
    );
  }
}
