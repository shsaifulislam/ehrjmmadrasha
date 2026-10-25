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

    const { searchParams } = new URL(req.url);
    const controlId = searchParams.get("controlId");

    let tests = RiskAssuranceStore.getControlTests();
    if (controlId) {
      tests = tests.filter((t) => t.controlId === controlId);
    }

    return NextResponse.json({
      success: true,
      total: tests.length,
      tests,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list control tests." },
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
      testMethod,
      populationDescription,
      sampleSize,
      expectedResultBn,
      actualResultBn,
      result,
      exceptionCount,
      evidenceRef,
      phase29DocToken,
      notes,
    } = body;

    if (!controlId || !testMethod || !expectedResultBn || !actualResultBn || !result || !evidenceRef) {
      return NextResponse.json(
        { success: false, error: "নিয়ন্ত্রণ আইডি, পরীক্ষা পদ্ধতি, প্রত্যাশিত ও বাস্তব ফলাফল, ফলাফল ও প্রমাণ রেফারেন্স আবশ্যক।" },
        { status: 400 }
      );
    }

    const tester: ActorContext = {
      actorId: user.userId || "admin",
      actorName: user.name || "Administrator",
      actorRole: user.role,
    };

    const newTest = ControlRegisterEngine.recordControlTest(
      {
        controlId,
        testMethod,
        populationDescription: populationDescription || "সাম্প্রতিক লেনদেন/রেকর্ডসমূহ",
        sampleSize: Number(sampleSize) || 10,
        expectedResultBn,
        actualResultBn,
        result,
        exceptionCount: Number(exceptionCount) || 0,
        evidenceRef,
        phase29DocToken,
        notes,
      },
      tester
    );

    return NextResponse.json({
      success: true,
      testRecord: newTest,
      message: "নিয়ন্ত্রণ পরীক্ষা ফলাফল সফলভাবে সংরক্ষিত হয়েছে।",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record control test." },
      { status: 500 }
    );
  }
}
