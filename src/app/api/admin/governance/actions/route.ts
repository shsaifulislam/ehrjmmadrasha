import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  FindingsActionEngine,
  ActorContext,
  ActionStatus,
} from "@/lib/riskAssurance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const findingId = searchParams.get("findingId");
    const status = searchParams.get("status") as ActionStatus | null;
    const overdueOnly = searchParams.get("overdue") === "true";
    const today = new Date().toISOString().split("T")[0];

    let list = RiskAssuranceStore.getActions();

    if (findingId) {
      list = list.filter((a) => a.findingId === findingId);
    }
    if (status) {
      list = list.filter((a) => a.status === status);
    }
    if (overdueOnly) {
      list = list.filter((a) => a.dueDate < today && a.status !== "COMPLETED" && a.status !== "VERIFIED");
    }

    return NextResponse.json({
      success: true,
      total: list.length,
      actions: list,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list corrective actions." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { findingId, actionType, actionDescriptionBn, assignedTo, dueDate, priority } = body;

    if (!findingId || !actionType || !actionDescriptionBn || !assignedTo || !dueDate) {
      return NextResponse.json(
        { success: false, error: "পর্যবেক্ষণ আইডি, অ্যাকশন ধরণ, বিবরণ, দায়িত্বপ্রাপ্ত কর্মকর্তা এবং সময়সীমা আবশ্যক।" },
        { status: 400 }
      );
    }

    const actor: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const newAction = FindingsActionEngine.createAction(
      {
        findingId,
        actionType,
        actionDescriptionBn,
        assignedTo,
        dueDate,
        priority,
      },
      actor
    );

    return NextResponse.json({
      success: true,
      actionItem: newAction,
      message: "সংশোধনমূলক ব্যবস্থা (CAPA) সফলভাবে যুক্ত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create corrective action." },
      { status: 500 }
    );
  }
}
