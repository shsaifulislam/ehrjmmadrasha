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
      titleBn: contract.titleBn,
      deliverables: contract.deliverables || [],
      threeWayMatchStatus: contract.threeWayMatchStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get contract obligations." },
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
    const { deliverableId } = body;

    if (!deliverableId) {
      return NextResponse.json(
        { success: false, error: "ডেলিভারেবল আইডি (deliverableId) আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const updatedContract = ContractEngine.markDeliverableCompleted(
      id,
      deliverableId,
      actor
    );

    return NextResponse.json({
      success: true,
      contract: updatedContract,
      deliverables: updatedContract.deliverables,
      message: "ডেলিভারেবল সফলভাবে সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update deliverable obligation." },
      { status: 500 }
    );
  }
}
