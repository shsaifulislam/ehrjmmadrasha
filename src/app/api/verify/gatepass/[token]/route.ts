import { NextRequest, NextResponse } from "next/server";
import { getGatePassByToken } from "@/lib/gatepass/gatepassEngine";
import { INSTITUTION_INFO } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ token: string }> }) {
  const params = await paramsPromise;
  try {
    const { token } = params;
    if (!token) {
      return NextResponse.json({ error: "টোকেন আবশ্যক।" }, { status: 400 });
    }

    const pass = await getGatePassByToken(token);

    if (!pass) {
      return NextResponse.json({
        verified: false,
        message: "অকার্যকর বা অস্তিত্বহীন গেটপাস। অনুগ্রহ করে মূল কপি যাচাই করুন।",
      }, { status: 404 });
    }

    const now = new Date();
    const returnTime = new Date(pass.returnExpected);
    const isOverdue = pass.status === "EXITED" && returnTime < now;

    return NextResponse.json({
      verified: true,
      institution: {
        nameBn: INSTITUTION_INFO.nameBn,
        nameEn: INSTITUTION_INFO.nameEn,
        establishedYear: "২০২১ ইং", // Strictly 2021
      },
      gatePass: {
        passNumber: pass.passNumber,
        studentNameBn: pass.studentNameBn,
        studentIdNumber: pass.studentIdNumber,
        className: pass.className,
        rollNumber: pass.rollNumber,
        residentialStatus: pass.residentialStatus,
        roomOrSeat: pass.roomOrSeat,
        purposeLabelBn: pass.purposeLabelBn,
        purposeDescription: pass.purposeDescription,
        escortName: pass.escortName,
        escortPhone: pass.escortPhone,
        escortRelation: pass.escortRelation,
        departureExpected: pass.departureExpected,
        returnExpected: pass.returnExpected,
        actualExitTime: pass.actualExitTime,
        actualReturnTime: pass.actualReturnTime,
        status: isOverdue ? "OVERDUE" : pass.status,
        approvedBy: pass.approvedBy,
        issuedAt: pass.issuedAt,
        securityNotes: pass.securityNotes,
      },
    });
  } catch (error: any) {
    console.error("GatePass Verification Error:", error);
    return NextResponse.json({ error: "যাচাইকরণ প্রক্রিয়ায় ত্রুটি ঘটেছে।" }, { status: 500 });
  }
}
