import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const examSubjects = await prisma.examSubject.findMany({
      where: {
        examId: params.id,
        ...(classId ? { classId } : {}),
      },
      include: {
        jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
        subject: { select: { id: true, nameBn: true, nameEn: true, code: true, isOptional: true } },
      },
      orderBy: { examDate: "asc" },
    });

    return NextResponse.json({ examSubjects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const { classId, subjectId, fullMarks = 100, passMarks = 33, examDate, startTime = "09:30 AM", endTime = "12:30 PM", batchFromClass = false } = body;

    const exam = await prisma.exam.findUnique({ where: { id: params.id } });
    if (!exam) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    if (batchFromClass) {
      if (!classId) {
        return NextResponse.json({ error: "জামাত নির্বাচন আবশ্যক।" }, { status: 400 });
      }
      const subjects = await prisma.subject.findMany({
        where: { classId, isActive: true },
      });

      let addedCount = 0;
      for (const s of subjects) {
        const existing = await prisma.examSubject.findFirst({
          where: { examId: params.id, classId, subjectId: s.id },
        });
        if (!existing) {
          await prisma.examSubject.create({
            data: {
              examId: params.id,
              classId,
              subjectId: s.id,
              examDate: examDate ? new Date(examDate) : exam.startDate,
              startTime,
              endTime,
              fullMarks: s.fullMarks || 100,
              passMarks: s.passMarks || 33,
            },
          });
          addedCount++;
        }
      }

      await recordAuditLog({
        userId: user.userId,
        action: "EXAM_SUBJECTS_BATCH_CONFIGURED",
        entityType: "ExamSubject",
        entityId: params.id,
        details: { examId: params.id, classId, addedCount },
      });

      return NextResponse.json({ message: `${addedCount} টি বিষয় সফলভাবে পরীক্ষায় অন্তর্ভুক্ত হয়েছে।` });
    }

    if (!classId || !subjectId) {
      return NextResponse.json({ error: "জামাত ও বিষয় নির্বাচন আবশ্যক।" }, { status: 400 });
    }

    const existing = await prisma.examSubject.findFirst({
      where: { examId: params.id, classId, subjectId },
    });

    let result;
    if (existing) {
      result = await prisma.examSubject.update({
        where: { id: existing.id },
        data: {
          fullMarks: Number(fullMarks),
          passMarks: Number(passMarks),
          ...(examDate ? { examDate: new Date(examDate) } : {}),
          startTime,
          endTime,
        },
      });
    } else {
      result = await prisma.examSubject.create({
        data: {
          examId: params.id,
          classId,
          subjectId,
          examDate: examDate ? new Date(examDate) : exam.startDate,
          startTime,
          endTime,
          fullMarks: Number(fullMarks),
          passMarks: Number(passMarks),
        },
      });
    }

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_SUBJECT_CONFIGURED",
      entityType: "ExamSubject",
      entityId: result.id,
      details: { examId: params.id, classId, subjectId, fullMarks, passMarks },
    });

    return NextResponse.json({ examSubject: result, message: "পরীক্ষার বিষয় কনফিগারেশন সংরক্ষিত হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
