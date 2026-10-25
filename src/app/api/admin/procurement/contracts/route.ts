import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ProcurementStore, ContractEngine, ContractStatus, ContractType, ActorContext } from "@/lib/procurement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") as ContractStatus) || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;
    const type = (searchParams.get("type") as ContractType) || undefined;
    const query = searchParams.get("query")?.toLowerCase().trim();

    // Trigger contract expiry checks on list
    ContractEngine.checkContractExpiries();

    let contracts = ProcurementStore.getContracts();

    if (status) {
      contracts = contracts.filter((c) => c.status === status);
    }
    if (vendorId) {
      contracts = contracts.filter((c) => c.vendorId === vendorId);
    }
    if (type) {
      contracts = contracts.filter((c) => c.contractType === type);
    }
    if (query) {
      contracts = contracts.filter(
        (c) =>
          c.titleBn.toLowerCase().includes(query) ||
          c.titleEn.toLowerCase().includes(query) ||
          c.contractCode.toLowerCase().includes(query) ||
          c.vendorNameBn.toLowerCase().includes(query)
      );
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
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or Principal access required." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.vendorId || !body.titleBn || !body.startDate || !body.endDate || body.totalContractValue === undefined) {
      return NextResponse.json(
        { success: false, error: "অনুগ্রহ করে ভেন্ডর, শিরোনাম, চুক্তির মেয়াদ এবং মোট চুক্তি মূল্য প্রদান করুন।" },
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
      message: `চুক্তিপত্র সফলভাবে প্রস্তুত করা হয়েছে (আইডি: ${contract.id})।`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create contract." },
      { status: 500 }
    );
  }
}
