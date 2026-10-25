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

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      currentVersion: contract.currentVersion,
      versions: contract.versions || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get contract versions." },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await req.json();
    const {
      changeReasonBn,
      revisedValue,
      revisedEndDate,
      revisedPaymentTerms,
      revisedScopeOfWorkBn,
      documentRef,
    } = body;

    if (!changeReasonBn) {
      return NextResponse.json(
        { success: false, error: "সংশোধনের কারণ (changeReasonBn) আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const updatedContract = ContractEngine.reviseContract(
      id,
      {
        changeReason: changeReasonBn,
        newContractValue: revisedValue,
        newEndDate: revisedEndDate,
        newPaymentTermsBn: revisedPaymentTerms,
        newNotes: revisedScopeOfWorkBn,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      currentVersion: updatedContract.currentVersion,
      latestVersionSnapshot: updatedContract.versions[updatedContract.versions.length - 1],
      message: `চুক্তিপত্রের নতুন সংস্করণ (v${updatedContract.currentVersion}) সফলভাবে সংরক্ষিত হয়েছে।`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contract version." },
      { status: 500 }
    );
  }
}
