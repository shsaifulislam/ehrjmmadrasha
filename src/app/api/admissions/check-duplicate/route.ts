import { NextRequest, NextResponse } from "next/server";
import { detectDuplicates } from "@/lib/duplicateDetection";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentNameBn,
      dateOfBirth,
      fatherNameBn,
      guardianPhone,
      birthCertificateNo,
      nidNo,
      excludeApplicationId,
    } = body;

    if (!studentNameBn && !guardianPhone && !birthCertificateNo) {
      return NextResponse.json({ success: true, hasDuplicates: false, matches: [] });
    }

    const matches = await detectDuplicates({
      studentNameBn,
      dateOfBirth,
      fatherNameBn,
      guardianPhone,
      birthCertificateNo,
      nidNo,
      excludeApplicationId,
    });

    return NextResponse.json({
      success: true,
      hasDuplicates: matches.length > 0,
      matches,
    });
  } catch (error: any) {
    console.error("Duplicate Check API Error:", error);
    return NextResponse.json({ error: "ডুপ্লিকেট যাচাই করতে ত্রুটি হয়েছে।" }, { status: 500 });
  }
}
