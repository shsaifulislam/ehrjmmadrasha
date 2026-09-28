import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { evaluateAdmissionApplication } from "@/lib/ai/aiEngine";
import { suggestArabicName } from "@/lib/arabicNames";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/admissions/arabic-name
 * Generates Arabic name orthography and evaluates admission completeness.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।" }, { status: 401 });
    }

    const body = await req.json();
    const { fullNameBn, fatherNameBn, motherNameBn, guardianPhone, dateOfBirth, hasBirthCertDoc } = body;

    const evaluation = evaluateAdmissionApplication({
      fullNameBn,
      fatherNameBn,
      motherNameBn,
      guardianPhone,
      dateOfBirth,
      hasBirthCertDoc,
    });

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    console.error("Arabic Name & Admission AI Error:", error);
    return NextResponse.json(
      { error: error.message || "আরবি নাম তৈরি বা আবেদন মূল্যায়নে ত্রুটি হয়েছে।" },
      { status: 500 }
    );
  }
}
