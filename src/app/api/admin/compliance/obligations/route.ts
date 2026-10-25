import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ComplianceStore,
  ObligationEngine,
  ComplianceCrossModuleBridge,
  ComplianceStatus,
  ObligationFrequency,
  ActorContext,
} from "@/lib/compliance";

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
    const requirementId = searchParams.get("requirementId");
    const status = searchParams.get("status") as ComplianceStatus | null;
    const frequency = searchParams.get("frequency") as ObligationFrequency | null;
    const ownerId = searchParams.get("ownerId");
    const isOverdue = searchParams.get("isOverdue") === "true";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const nowStr = new Date().toISOString().slice(0, 10);
    let list = ComplianceStore.getObligations();

    if (requirementId) {
      list = list.filter((o) => o.requirementId === requirementId);
    }
    if (status) {
      list = list.filter((o) => o.status === status);
    }
    if (frequency) {
      list = list.filter((o) => o.frequency === frequency);
    }
    if (ownerId) {
      list = list.filter((o) => o.ownerId === ownerId);
    }
    if (isOverdue) {
      list = list.filter(
        (o) =>
          o.dueDate < nowStr &&
          o.status !== "COMPLIANT" &&
          o.status !== "CLOSED" &&
          o.status !== "ARCHIVED"
      );
    }
    if (search) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(search) ||
          o.title.toLowerCase().includes(search) ||
          o.ownerName.toLowerCase().includes(search) ||
          o.description.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
      count: list.length,
    });
  } catch (err: any) {
    console.error("[API Obligations GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "অভ্যন্তরীণ সার্ভার ত্রুটি।" },
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
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "অ্যাডমিনিস্ট্রেটর",
      userRole: user.role,
    };

    const newObligation = ObligationEngine.createObligation(body, actor);

    // Auto-sync due date to Phase 33 calendar
    await ComplianceCrossModuleBridge.syncObligationToCalendar(newObligation.id);

    return NextResponse.json({
      success: true,
      data: newObligation,
      message: "নতুন কমপ্লায়েন্স দায় ও সময়সীমা সফলভাবে সংরক্ষিত ও ক্যালেন্ডারে সিঙ্ক হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Obligations POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "সংরক্ষণে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
