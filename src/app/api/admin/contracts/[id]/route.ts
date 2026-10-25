import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  ContractEngine,
  ActorContext,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req);
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

    const vendor = ProcurementStore.getVendorById(contract.vendorId);

    return NextResponse.json({
      success: true,
      contract,
      vendor,
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
    const user = await getSessionUser(req);
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

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const body = await req.json();
    const { action } = body;

    let updatedContract = contract;

    if (action === "TRANSITION_STATUS") {
      if (!body.targetStatus || !body.reasonBn) {
        return NextResponse.json(
          { success: false, error: "টার্গেট স্ট্যাটাস এবং কারণ আবশ্যক।" },
          { status: 400 }
        );
      }
      updatedContract = ContractEngine.transitionContractStatus(
        id,
        body.targetStatus,
        body.reasonBn,
        actor
      );
    } else if (action === "REVISE_CONTRACT") {
      if (!body.changeReasonBn) {
        return NextResponse.json(
          { success: false, error: "সংশোধনের কারণ (changeReasonBn) আবশ্যক।" },
          { status: 400 }
        );
      }
      updatedContract = ContractEngine.reviseContract(
        id,
        {
          changeReason: body.changeReasonBn,
          newContractValue: body.revisedValue,
          newEndDate: body.revisedEndDate,
          newPaymentTermsBn: body.revisedPaymentTerms,
          newNotes: body.revisedScopeOfWorkBn,
        },
        actor
      );
    } else if (action === "COMPLETE_DELIVERABLE") {
      if (!body.deliverableId) {
        return NextResponse.json(
          { success: false, error: "ডেলিভারেবল আইডি আবশ্যক।" },
          { status: 400 }
        );
      }
      updatedContract = ContractEngine.markDeliverableCompleted(
        id,
        body.deliverableId,
        actor
      );
    } else {
      // General field update
      const allowed = ["titleBn", "titleEn", "paymentTermsBn", "scopeOfWorkBn", "notes"];
      for (const k of allowed) {
        if (body[k] !== undefined) {
          (contract as any)[k] = body[k];
        }
      }
      updatedContract = ProcurementStore.saveContract(contract, actor);
    }

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      message: "চুক্তিপত্র সফলভাবে হালনাগাদ করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update contract." },
      { status: 500 }
    );
  }
}
