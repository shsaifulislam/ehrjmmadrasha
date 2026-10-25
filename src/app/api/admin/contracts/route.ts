import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ProcurementStore,
  ContractEngine,
  ContractType,
  ContractStatus,
  ActorContext,
} from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId") || undefined;
    const status = (searchParams.get("status") as ContractStatus) || undefined;
    const type = (searchParams.get("type") as ContractType) || undefined;
    const expiringOnly = searchParams.get("expiringOnly") === "true";

    let contracts = ProcurementStore.getContracts();

    if (vendorId) {
      contracts = contracts.filter((c) => c.vendorId === vendorId);
    }
    if (status) {
      contracts = contracts.filter((c) => c.status === status);
    }
    if (type) {
      contracts = contracts.filter((c) => c.contractType === type);
    }
    if (expiringOnly) {
      contracts = ContractEngine.checkExpiringContracts(60);
    }

    return NextResponse.json({
      success: true,
      total: contracts.length,
      contracts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list contracts." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.vendorId || !body.titleBn || !body.startDate || !body.endDate || !body.totalContractValue) {
      return NextResponse.json(
        { success: false, error: "ভেন্ডর, চুক্তির শিরোনাম, মেয়াদকাল এবং মূল্য আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const contract = ContractEngine.createContract(body, actor);

    return NextResponse.json({
      success: true,
      contract,
      message: "প্রাতিষ্ঠানিক চুক্তিপত্র সফলভাবে প্রণয়ন করা হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contract." },
      { status: 500 }
    );
  }
}
