import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/security";
import {
  getGatePassList,
  getGatePassStats,
  issueGatePass,
  GatePassRecord,
  GATEPASS_PURPOSE_MAP,
} from "@/lib/gatepass/gatepassEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const studentIdParam = searchParams.get("studentId");
    const search = searchParams.get("search") || undefined;

    // If Guardian, only return their child's gatepasses
    let guardianStudentId: string | undefined = undefined;
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: user.userId },
        include: { students: true },
      });
      if (!guardian || guardian.students.length === 0) {
        return NextResponse.json({
          success: true,
          data: { records: [], stats: null, residentialStudents: [] },
        });
      }
      guardianStudentId = studentIdParam || guardian.students[0].studentId;
    }

    const [records, stats] = await Promise.all([
      getGatePassList({
        status,
        studentId: guardianStudentId || studentIdParam || undefined,
        search,
      }),
      getGatePassStats(),
    ]);

    // For authorized staff (Admin/Teacher), also return active residential students list for pass issuance modal
    let residentialStudents: any[] = [];
    if (["ADMIN", "TEACHER", "PRINCIPAL"].includes(user.role)) {
      residentialStudents = await prisma.student.findMany({
        where: { residentialStatus: "RESIDENTIAL", status: "ACTIVE" },
        select: {
          id: true,
          fullNameBn: true,
          studentIdNumber: true,
          fatherNameBn: true,
          fatherPhone: true,
          enrollments: {
            where: { status: "ACTIVE" },
            select: {
              rollNumber: true,
              jamatClass: { select: { nameBn: true } },
            },
            take: 1,
          },
        },
        orderBy: { studentIdNumber: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        records,
        stats,
        purposeOptions: GATEPASS_PURPOSE_MAP,
        residentialStudents: residentialStudents.map((s) => ({
          id: s.id,
          fullNameBn: s.fullNameBn,
          studentIdNumber: s.studentIdNumber,
          className: s.enrollments[0]?.jamatClass?.nameBn || "হিফজুল কুরআন",
          rollNumber: s.enrollments[0]?.rollNumber || 1,
          fatherNameBn: s.fatherNameBn,
          fatherPhone: s.fatherPhone,
        })),
      },
    });
  } catch (error: any) {
    console.error("GatePass GET Error:", error);
    return NextResponse.json({ error: "গেটপাস তথ্য লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !["ADMIN", "TEACHER", "PRINCIPAL"].includes(user.role)) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস। শুধুমাত্র আসাতাজা বা প্রশাসন গেটপাস ইস্যু করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const {
      studentId,
      purpose,
      purposeDescription,
      escortName,
      escortPhone,
      escortRelation,
      departureExpected,
      returnExpected,
      roomOrSeat,
    } = body;

    if (!studentId || !purpose || !departureExpected || !returnExpected) {
      return NextResponse.json(
        { error: "প্রয়োজনীয় সকল তথ্য পূরণ করুন (শিক্ষার্থী, গমনের কারণ ও সময়)।" },
        { status: 400 }
      );
    }

    const newPass = await issueGatePass({
      studentId,
      purpose,
      purposeDescription: purposeDescription || "মাদরাসা কর্তৃপক্ষের অনুমোদনক্রমে বহির্গমন।",
      escortName: escortName || "স্বয়ং শিক্ষার্থী / অভিভাবক",
      escortPhone: escortPhone || "০১৭১১০০০০০০",
      escortRelation: escortRelation || "পিতা / অভিভাবক",
      departureExpected,
      returnExpected,
      roomOrSeat,
      approvedBy: user.name || "হোস্টেল সুপারিনটেনডেন্ট",
    });

    await recordAuditLog({
      action: "ISSUE_GATE_PASS",
      entityType: "GatePass",
      entityId: newPass.id,
      userId: user.userId,
      details: {
        passNumber: newPass.passNumber,
        studentId: newPass.studentId,
        purpose: newPass.purpose,
      },
    });

    return NextResponse.json({
      success: true,
      message: `গেটপাস #${newPass.passNumber} সফলভাবে অনুমোদিত ও ইস্যু করা হয়েছে।`,
      data: newPass,
    });
  } catch (error: any) {
    console.error("GatePass POST Error:", error);
    return NextResponse.json({ error: error.message || "গেটপাস তৈরিতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
