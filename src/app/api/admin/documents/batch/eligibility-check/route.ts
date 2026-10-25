import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { validateDocumentEligibility } from "@/lib/documentFactory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/documents/batch/eligibility-check
 * Evaluates bulk eligibility for a list of students before generation
 * Categorizes into: Eligible, Already Issued, Ineligible
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "PRINCIPAL")) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 403 });
    }

    const body = await req.json();
    const { studentIds, documentType, sessionId } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: "শিক্ষার্থী তালিকা আবশ্যক।" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: "ডকুমেন্টের ধরন নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    // Fetch existing active certificates for these students of this docType
    const existingCerts = await prisma.certificate.findMany({
      where: {
        studentId: { in: studentIds },
        certificateType: documentType,
        isRevoked: false,
        status: "ISSUED",
      },
      select: {
        studentId: true,
        certificateNumber: true,
      },
    });

    const existingMap = new Map<string, string>();
    for (const c of existingCerts) {
      existingMap.set(c.studentId, c.certificateNumber);
    }

    const eligibleStudentIds: string[] = [];
    const alreadyIssuedStudentIds: string[] = [];
    const ineligibleStudentIds: string[] = [];
    const details: any[] = [];

    for (const sId of studentIds) {
      // 1. Check if already actively issued
      if (existingMap.has(sId)) {
        alreadyIssuedStudentIds.push(sId);
        details.push({
          studentId: sId,
          status: "ALREADY_ISSUED",
          certificateNumber: existingMap.get(sId),
          reason: `ইতিমধ্যে সক্রিয় রয়েছে (নম্বর: ${existingMap.get(sId)})`,
        });
        continue;
      }

      // 2. Validate eligibility
      const res = await validateDocumentEligibility(sId, documentType, sessionId);
      if (res.eligible) {
        eligibleStudentIds.push(sId);
        details.push({
          studentId: sId,
          status: "ELIGIBLE",
          reason: "যোগ্য",
        });
      } else {
        ineligibleStudentIds.push(sId);
        details.push({
          studentId: sId,
          status: "INELIGIBLE",
          reason: res.reason || "অযোগ্য",
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: studentIds.length,
        eligible: eligibleStudentIds.length,
        alreadyIssued: alreadyIssuedStudentIds.length,
        ineligible: ineligibleStudentIds.length,
      },
      eligibleStudentIds,
      alreadyIssuedStudentIds,
      ineligibleStudentIds,
      details,
    });
  } catch (error: any) {
    console.error("Batch eligibility check error:", error);
    return NextResponse.json({ error: "ব্যাচ যোগ্যতা যাচাইয়ে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
