import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getNextRollNumber } from "@/lib/studentId";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "কেবলমাত্র অ্যাডমিন প্রমোশন পরিচালনা করতে পারেন।" }, { status: 403 });
    }

    const body = await req.json();
    const { fromSessionId, fromClassId, fromSectionId, toSessionId, toClassId, toSectionId } = body;

    if (!fromSessionId || !fromClassId || !toSessionId || !toClassId) {
      return NextResponse.json(
        { error: "উৎস সেশন ও শ্রেণি এবং লক্ষ্য সেশন ও শ্রেণি নির্বাচন আবশ্যক।" },
        { status: 400 }
      );
    }

    // Fetch active enrolled students from source
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sessionId: fromSessionId,
        classId: fromClassId,
        ...(fromSectionId ? { sectionId: fromSectionId } : {}),
        status: "ACTIVE",
        student: {
          status: "ACTIVE",
        },
      },
      include: {
        student: {
          select: {
            id: true,
            studentIdNumber: true,
            fullNameBn: true,
            residentialStatus: true,
          },
        },
        jamatClass: { select: { nameBn: true } },
        section: { select: { nameBn: true } },
      },
      orderBy: { rollNumber: "asc" },
    });

    // Find starting roll for target class/section
    const startRoll = await getNextRollNumber(toSessionId, toClassId, toSectionId);

    const candidates = enrollments.map((e, index) => ({
      studentId: e.student.id,
      studentIdNumber: e.student.studentIdNumber,
      fullNameBn: e.student.fullNameBn,
      residentialStatus: e.student.residentialStatus,
      currentRoll: e.rollNumber,
      currentClass: e.jamatClass.nameBn,
      currentSection: e.section?.nameBn || "সাধারণ",
      proposedRoll: startRoll + index,
    }));

    return NextResponse.json({
      success: true,
      candidates,
      totalCandidates: candidates.length,
      nextAvailableRoll: startRoll,
    });
  } catch (error: any) {
    console.error("POST Promotion Preview Error:", error);
    return NextResponse.json({ error: error.message || "প্রমোশন প্রিভিউ তৈরি করতে ত্রুটি।" }, { status: 500 });
  }
}
