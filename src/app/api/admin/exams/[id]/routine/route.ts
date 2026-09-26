import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/security";
import { checkRoutineConflict } from "@/lib/resultCalculationService";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");

    const routines = await prisma.examRoutine.findMany({
      where: {
        examId: params.id,
        ...(classId ? { classId } : {}),
        ...(sectionId ? { sectionId } : {}),
      },
      orderBy: [{ examDate: "asc" }, { startTime: "asc" }],
      include: {
        jamatClass: { select: { id: true, nameBn: true, nameEn: true, code: true } },
        section: { select: { id: true, nameBn: true, nameEn: true } },
        subject: { select: { id: true, nameBn: true, nameEn: true, code: true, fullMarks: true, passMarks: true } },
      },
    });

    return NextResponse.json({ routines });
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
    const { classId, sectionId, subjectId, examDate, startTime, endTime, roomNo, instructions, status = "PUBLISHED" } = body;

    if (!classId || !subjectId || !examDate || !startTime || !endTime) {
      return NextResponse.json(
        { error: "জামাত, বিষয়, পরীক্ষার তারিখ, শুরুর সময় ও শেষের সময় আবশ্যক।" },
        { status: 400 }
      );
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: params.id } });
    if (!exam) {
      return NextResponse.json({ error: "পরীক্ষাটি পাওয়া যায়নি।" }, { status: 404 });
    }

    // Check conflict
    const dateObj = new Date(examDate);
    const conflict = await checkRoutineConflict({
      examId: params.id,
      classId,
      sectionId: sectionId || null,
      subjectId,
      examDate: dateObj,
      startTime,
      endTime,
    });

    if (conflict.hasConflict) {
      return NextResponse.json(
        { error: `রুটিন সংঘাত (Conflict detected): ${conflict.reason}` },
        { status: 409 }
      );
    }

    const routine = await prisma.examRoutine.create({
      data: {
        examId: params.id,
        classId,
        sectionId: sectionId || null,
        subjectId,
        examDate: dateObj,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        roomNo: roomNo ? roomNo.trim() : null,
        instructions: instructions ? instructions.trim() : null,
        status,
      },
      include: {
        jamatClass: true,
        section: true,
        subject: true,
      },
    });

    // Also ensure ExamSubject record exists for this exam, class, subject
    const existingExamSub = await prisma.examSubject.findFirst({
      where: {
        examId: params.id,
        classId,
        subjectId,
      },
    });

    if (!existingExamSub) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      await prisma.examSubject.create({
        data: {
          examId: params.id,
          classId,
          subjectId,
          examDate: dateObj,
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          fullMarks: subject?.fullMarks || 100,
          passMarks: subject?.passMarks || 33,
        },
      });
    }

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_ROUTINE_CREATED",
      entityType: "ExamRoutine",
      entityId: routine.id,
      details: {
        examId: params.id,
        classId,
        subjectId,
        date: routine.examDate,
        time: routine.startTime,
      },
    });

    return NextResponse.json({ routine, message: "পরীক্ষার রুটিন সফলভাবে যুক্ত হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const body = await req.json();
    const { routineId, examDate, startTime, endTime, roomNo, instructions, status } = body;

    if (!routineId) {
      return NextResponse.json({ error: "রুটিন আইডি আবশ্যক।" }, { status: 400 });
    }

    const existing = await prisma.examRoutine.findUnique({ where: { id: routineId } });
    if (!existing) {
      return NextResponse.json({ error: "রুটিনটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const dateObj = examDate ? new Date(examDate) : existing.examDate;
    const finalStart = startTime ? startTime.trim() : existing.startTime;
    const finalEnd = endTime ? endTime.trim() : existing.endTime;

    // Check conflict if date or time changed
    if (examDate || startTime || endTime) {
      const conflict = await checkRoutineConflict({
        examId: params.id,
        classId: existing.classId,
        sectionId: existing.sectionId,
        subjectId: existing.subjectId,
        examDate: dateObj,
        startTime: finalStart,
        endTime: finalEnd,
        excludeRoutineId: routineId,
      });

      if (conflict.hasConflict) {
        return NextResponse.json(
          { error: `রুটিন সংঘাত (Conflict detected): ${conflict.reason}` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.examRoutine.update({
      where: { id: routineId },
      data: {
        examDate: dateObj,
        startTime: finalStart,
        endTime: finalEnd,
        ...(roomNo !== undefined ? { roomNo: roomNo ? roomNo.trim() : null } : {}),
        ...(instructions !== undefined ? { instructions: instructions ? instructions.trim() : null } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        jamatClass: true,
        section: true,
        subject: true,
      },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_ROUTINE_UPDATED",
      entityType: "ExamRoutine",
      entityId: updated.id,
      details: { examId: params.id, routineId, status: updated.status },
    });

    return NextResponse.json({ routine: updated, message: "রুটিন সফলভাবে হালনাগাদ হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত অ্যাক্সেস।" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const routineId = searchParams.get("routineId");

    if (!routineId) {
      return NextResponse.json({ error: "রুটিন আইডি আবশ্যক।" }, { status: 400 });
    }

    await prisma.examRoutine.delete({
      where: { id: routineId },
    });

    await recordAuditLog({
      userId: user.userId,
      action: "EXAM_ROUTINE_DELETED",
      entityType: "ExamRoutine",
      entityId: routineId,
      details: { examId: params.id },
    });

    return NextResponse.json({ message: "রুটিন সফলভাবে অপসারিত হয়েছে।" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "সার্ভার এরর" }, { status: 500 });
  }
}
