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

    const now = new Date();
    const endDate = new Date(contract.endDate);
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      success: true,
      contractId: contract.id,
      titleBn: contract.titleBn,
      vendorName: contract.vendorNameBn,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      daysUntilExpiry: diffDays,
      renewalReminders: contract.renewalReminders || [],
      isRenewalDue: diffDays <= 60,
      versionsCount: contract.versions?.length || 1,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get contract renewal info." },
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
    const { newEndDate, renewalReasonBn, revisedValue, notes } = body;

    if (!newEndDate || !renewalReasonBn) {
      return NextResponse.json(
        { success: false, error: "নবায়নকৃত শেষ তারিখ (newEndDate) এবং নবায়নের কারণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    // Contract renewal creates a new revision version and extends dates
    const updatedContract = ContractEngine.reviseContract(
      id,
      {
        changeReason: `চুক্তি নবায়ন: ${renewalReasonBn}`,
        newEndDate,
        newContractValue: revisedValue || contract.totalContractValue,
      },
      actor
    );

    // Transition to ACTIVE if it was EXPIRING or EXPIRED
    if (updatedContract.status === "EXPIRING" || updatedContract.status === "EXPIRED") {
      ContractEngine.transitionContractStatus(
        id,
        "ACTIVE",
        `নবায়নের ফলে চুক্তিপত্র পুনরায় সক্রিয় করা হয়েছে (মেয়াদ: ${newEndDate})`,
        actor
      );
    }

    const finalContract = ProcurementStore.getContractById(id)!;

    return NextResponse.json({
      success: true,
      contract: finalContract,
      message: `চুক্তি সফলভাবে নবায়ন করা হয়েছে। নতুন মেয়াদ: ${newEndDate}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process contract renewal." },
      { status: 500 }
    );
  }
}
