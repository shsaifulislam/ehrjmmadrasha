import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  RiskAssuranceStore,
  ControlRegisterEngine,
  ActorContext,
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

    // Auto-scan expired exceptions
    ControlRegisterEngine.scanExpiredExceptions();
    const exceptions = RiskAssuranceStore.getExceptions();

    return NextResponse.json({
      success: true,
      total: exceptions.length,
      exceptions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list exceptions." },
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
    const {
      controlId,
      exceptionReasonBn,
      scopeBn,
      startDate,
      endDate,
      compensatingControlBn,
      evidenceRef,
      reviewDate,
    } = body;

    if (!controlId || !exceptionReasonBn || !scopeBn || !startDate || !endDate || !compensatingControlBn) {
      return NextResponse.json(
        { success: false, error: "নিয়ন্ত্রণ আইডি, কারণ, আওতা, শুরু ও শেষ তারিখ এবং ক্ষতিপূরণমূলক বিকল্প নিয়ন্ত্রণ আবশ্যক।" },
        { status: 400 }
      );
    }

    const approver: ActorContext = {
      actorId: user.userId || "principal-01",
      actorName: user.name || "মুহতামিম সাহেব (অধ্যক্ষ)",
      actorRole: user.role,
    };

    const newException = ControlRegisterEngine.recordException(
      {
        controlId,
        exceptionReasonBn,
        scopeBn,
        startDate,
        endDate,
        compensatingControlBn,
        evidenceRef,
        reviewDate,
      },
      approver
    );

    return NextResponse.json({
      success: true,
      exception: newException,
      message: "নিয়ন্ত্রণ ব্যতিক্রম ও বিকল্প ব্যবস্থা সফলভাবে অনুমোদিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record exception." },
      { status: 500 }
    );
  }
}
