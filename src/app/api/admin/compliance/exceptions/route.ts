import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  ComplianceStore,
  ObligationEngine,
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

    ObligationEngine.scanExpiredExceptions();
    const exceptions = ComplianceStore.getExceptions();

    return NextResponse.json({
      success: true,
      data: exceptions,
      count: exceptions.length,
    });
  } catch (err: any) {
    console.error("[API Exceptions GET] Error:", err);
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

    const newException = ObligationEngine.requestException(body, actor);

    return NextResponse.json({
      success: true,
      data: newException,
      message: "ব্যতিক্রম ও রেয়াতের আবেদন সফলভাবে জমা হয়েছে।",
    });
  } catch (err: any) {
    console.error("[API Exceptions POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "ব্যতিক্রম আবেদনে ব্যর্থ।" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json(
        { success: false, error: "অননুমোদিত প্রবেশাধিকার। শুধুমাত্র অধ্যক্ষ মহোদয়ের অনুমোদনের এখতিয়ার রয়েছে।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const actor: ActorContext = {
      userId: user.userId || "ADMIN-01",
      userName: user.email || "মুহতামিম / অধ্যক্ষ সাহেব",
      userRole: user.role,
    };

    const updated = ObligationEngine.decideException(
      body.exceptionId,
      body.decision, // "APPROVED" | "REJECTED"
      body.reason || "অধ্যক্ষ কর্তৃক পর্যালোচনা সম্পন্ন",
      actor
    );

    return NextResponse.json({
      success: true,
      data: updated,
      message: `ব্যতিক্রমের আবেদন সফলভাবে '${body.decision}' করা হয়েছে।`,
    });
  } catch (err: any) {
    console.error("[API Exceptions PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "সিদ্ধান্ত গ্রহণে ব্যর্থ।" },
      { status: 400 }
    );
  }
}
